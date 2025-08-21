package telemetry

import (
	"context"
	"fmt"
	"net"
	"time"

	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/trace"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DatabaseMetrics holds database-related metrics
type DatabaseMetrics struct {
	dbQueryDuration metric.Float64Histogram
	dbQueryCount    metric.Int64Counter
	dbConnections   metric.Int64UpDownCounter
	redisOpDuration metric.Float64Histogram
	redisOpCount    metric.Int64Counter
}

// NewDatabaseMetrics creates new database metrics
func NewDatabaseMetrics() (*DatabaseMetrics, error) {
	meter := otel.Meter("finance-manager/database")

	dbQueryDuration, err := meter.Float64Histogram(
		"db_query_duration_seconds",
		metric.WithDescription("Duration of database queries in seconds"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return nil, err
	}

	dbQueryCount, err := meter.Int64Counter(
		"db_queries_total",
		metric.WithDescription("Total number of database queries"),
	)
	if err != nil {
		return nil, err
	}

	dbConnections, err := meter.Int64UpDownCounter(
		"db_connections_active",
		metric.WithDescription("Number of active database connections"),
	)
	if err != nil {
		return nil, err
	}

	redisOpDuration, err := meter.Float64Histogram(
		"redis_operation_duration_seconds",
		metric.WithDescription("Duration of Redis operations in seconds"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return nil, err
	}

	redisOpCount, err := meter.Int64Counter(
		"redis_operations_total",
		metric.WithDescription("Total number of Redis operations"),
	)
	if err != nil {
		return nil, err
	}

	return &DatabaseMetrics{
		dbQueryDuration: dbQueryDuration,
		dbQueryCount:    dbQueryCount,
		dbConnections:   dbConnections,
		redisOpDuration: redisOpDuration,
		redisOpCount:    redisOpCount,
	}, nil
}

// GORMTracer implements GORM's logger interface for tracing
type GORMTracer struct {
	logger.Interface
	tracer  trace.Tracer
	metrics *DatabaseMetrics
}

// NewGORMTracer creates a new GORM tracer
func NewGORMTracer(baseLogger logger.Interface, metrics *DatabaseMetrics) *GORMTracer {
	return &GORMTracer{
		Interface: baseLogger,
		tracer:    otel.Tracer("finance-manager/gorm"),
		metrics:   metrics,
	}
}

// Trace implements the GORM logger interface
func (g *GORMTracer) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	// Call the base logger first
	g.Interface.Trace(ctx, begin, fc, err)

	// Get SQL and rows affected
	sql, rowsAffected := fc()

	// Start a new span
	ctx, span := g.tracer.Start(ctx, "gorm.query")
	defer span.End()

	// Calculate duration
	duration := time.Since(begin)

	// Set span attributes
	span.SetAttributes(
		attribute.String("db.system", "postgresql"), // Adjust based on your database
		attribute.String("db.statement", sql),
		attribute.Int64("db.rows_affected", rowsAffected),
		attribute.Float64("db.duration_ms", float64(duration.Nanoseconds())/1e6),
	)

	// Record error if any
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
	} else {
		span.SetStatus(codes.Ok, "")
	}

	// Record metrics
	if g.metrics != nil {
		attrs := []attribute.KeyValue{
			attribute.String("db.operation", extractOperation(sql)),
			attribute.Bool("db.error", err != nil),
		}

		g.metrics.dbQueryCount.Add(ctx, 1, metric.WithAttributes(attrs...))
		g.metrics.dbQueryDuration.Record(ctx, duration.Seconds(), metric.WithAttributes(attrs...))
	}
}

// extractOperation extracts the SQL operation type from the query
func extractOperation(sql string) string {
	if len(sql) == 0 {
		return "unknown"
	}

	// Simple extraction - you might want to make this more sophisticated
	switch {
	case len(sql) >= 6 && sql[:6] == "SELECT":
		return "SELECT"
	case len(sql) >= 6 && sql[:6] == "INSERT":
		return "INSERT"
	case len(sql) >= 6 && sql[:6] == "UPDATE":
		return "UPDATE"
	case len(sql) >= 6 && sql[:6] == "DELETE":
		return "DELETE"
	default:
		return "unknown"
	}
}

// RedisHook implements Redis hook for tracing
type RedisHook struct {
	tracer  trace.Tracer
	metrics *DatabaseMetrics
}

// NewRedisHook creates a new Redis hook
func NewRedisHook(metrics *DatabaseMetrics) *RedisHook {
	return &RedisHook{
		tracer:  otel.Tracer("finance-manager/redis"),
		metrics: metrics,
	}
}

// DialHook implements redis.DialHook
func (h *RedisHook) DialHook(next redis.DialHook) redis.DialHook {
	return func(ctx context.Context, network, addr string) (net.Conn, error) {
		ctx, span := h.tracer.Start(ctx, "redis.dial")
		defer span.End()

		span.SetAttributes(
			attribute.String("redis.network", network),
			attribute.String("redis.addr", addr),
		)

		conn, err := next(ctx, network, addr)
		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
		} else {
			span.SetStatus(codes.Ok, "")
		}

		return conn, err
	}
}

// ProcessHook implements redis.ProcessHook
func (h *RedisHook) ProcessHook(next redis.ProcessHook) redis.ProcessHook {
	return func(ctx context.Context, cmd redis.Cmder) error {
		start := time.Now()
		ctx, span := h.tracer.Start(ctx, fmt.Sprintf("redis.%s", cmd.Name()))
		defer span.End()

		span.SetAttributes(
			attribute.String("redis.command", cmd.Name()),
			attribute.String("redis.args", fmt.Sprintf("%v", cmd.Args())),
		)

		err := next(ctx, cmd)
		duration := time.Since(start)

		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
		} else {
			span.SetStatus(codes.Ok, "")
		}

		// Record metrics
		if h.metrics != nil {
			attrs := []attribute.KeyValue{
				attribute.String("redis.command", cmd.Name()),
				attribute.Bool("redis.error", err != nil),
			}

			h.metrics.redisOpCount.Add(ctx, 1, metric.WithAttributes(attrs...))
			h.metrics.redisOpDuration.Record(ctx, duration.Seconds(), metric.WithAttributes(attrs...))
		}

		return err
	}
}

// ProcessPipelineHook implements redis.ProcessPipelineHook
func (h *RedisHook) ProcessPipelineHook(next redis.ProcessPipelineHook) redis.ProcessPipelineHook {
	return func(ctx context.Context, cmds []redis.Cmder) error {
		start := time.Now()
		ctx, span := h.tracer.Start(ctx, "redis.pipeline")
		defer span.End()

		span.SetAttributes(
			attribute.Int("redis.pipeline.length", len(cmds)),
		)

		err := next(ctx, cmds)
		duration := time.Since(start)

		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
		} else {
			span.SetStatus(codes.Ok, "")
		}

		// Record metrics
		if h.metrics != nil {
			attrs := []attribute.KeyValue{
				attribute.String("redis.operation", "pipeline"),
				attribute.Int("redis.commands_count", len(cmds)),
				attribute.Bool("redis.error", err != nil),
			}

			h.metrics.redisOpCount.Add(ctx, int64(len(cmds)), metric.WithAttributes(attrs...))
			h.metrics.redisOpDuration.Record(ctx, duration.Seconds(), metric.WithAttributes(attrs...))
		}

		return err
	}
}

// InstrumentGORM adds tracing to a GORM database instance
func InstrumentGORM(db *gorm.DB, metrics *DatabaseMetrics) *gorm.DB {
	tracer := NewGORMTracer(db.Logger, metrics)
	return db.Session(&gorm.Session{Logger: tracer})
}

// InstrumentRedis adds tracing to a Redis client
func InstrumentRedis(client *redis.Client, metrics *DatabaseMetrics) {
	hook := NewRedisHook(metrics)
	client.AddHook(hook)
}
