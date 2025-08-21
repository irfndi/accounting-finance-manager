package telemetry

import (
	"context"
	"runtime"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/metric"
)

// ApplicationMetrics holds all application-specific metrics
type ApplicationMetrics struct {
	// Business metrics
	userRegistrations metric.Int64Counter
	userLogins        metric.Int64Counter
	transactionCount  metric.Int64Counter
	transactionAmount metric.Float64Histogram
	activeUsers       metric.Int64UpDownCounter

	// System metrics
	goroutineCount metric.Int64UpDownCounter
	memoryUsage    metric.Int64UpDownCounter
	gcDuration     metric.Float64Histogram

	// Error metrics
	errorCount metric.Int64Counter
	panicCount metric.Int64Counter
}

// NewApplicationMetrics creates new application metrics
func NewApplicationMetrics() (*ApplicationMetrics, error) {
	meter := otel.Meter("finance-manager/application")

	// Business metrics
	userRegistrations, err := meter.Int64Counter(
		"user_registrations_total",
		metric.WithDescription("Total number of user registrations"),
	)
	if err != nil {
		return nil, err
	}

	userLogins, err := meter.Int64Counter(
		"user_logins_total",
		metric.WithDescription("Total number of user logins"),
	)
	if err != nil {
		return nil, err
	}

	transactionCount, err := meter.Int64Counter(
		"transactions_total",
		metric.WithDescription("Total number of financial transactions"),
	)
	if err != nil {
		return nil, err
	}

	transactionAmount, err := meter.Float64Histogram(
		"transaction_amount",
		metric.WithDescription("Amount of financial transactions"),
		metric.WithUnit("USD"),
	)
	if err != nil {
		return nil, err
	}

	activeUsers, err := meter.Int64UpDownCounter(
		"active_users",
		metric.WithDescription("Number of currently active users"),
	)
	if err != nil {
		return nil, err
	}

	// System metrics
	goroutineCount, err := meter.Int64UpDownCounter(
		"goroutines_active",
		metric.WithDescription("Number of active goroutines"),
	)
	if err != nil {
		return nil, err
	}

	memoryUsage, err := meter.Int64UpDownCounter(
		"memory_usage_bytes",
		metric.WithDescription("Current memory usage in bytes"),
		metric.WithUnit("By"),
	)
	if err != nil {
		return nil, err
	}

	gcDuration, err := meter.Float64Histogram(
		"gc_duration_seconds",
		metric.WithDescription("Garbage collection duration in seconds"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return nil, err
	}

	// Error metrics
	errorCount, err := meter.Int64Counter(
		"errors_total",
		metric.WithDescription("Total number of errors"),
	)
	if err != nil {
		return nil, err
	}

	panicCount, err := meter.Int64Counter(
		"panics_total",
		metric.WithDescription("Total number of panics"),
	)
	if err != nil {
		return nil, err
	}

	return &ApplicationMetrics{
		userRegistrations: userRegistrations,
		userLogins:        userLogins,
		transactionCount:  transactionCount,
		transactionAmount: transactionAmount,
		activeUsers:       activeUsers,
		goroutineCount:    goroutineCount,
		memoryUsage:       memoryUsage,
		gcDuration:        gcDuration,
		errorCount:        errorCount,
		panicCount:        panicCount,
	}, nil
}

// Business metric methods

// RecordUserRegistration records a user registration event
func (m *ApplicationMetrics) RecordUserRegistration(ctx context.Context, userType string) {
	m.userRegistrations.Add(ctx, 1, metric.WithAttributes(
		attribute.String("user_type", userType),
	))
}

// RecordUserLogin records a user login event
func (m *ApplicationMetrics) RecordUserLogin(ctx context.Context, userID string, method string) {
	m.userLogins.Add(ctx, 1, metric.WithAttributes(
		attribute.String("user_id", userID),
		attribute.String("login_method", method),
	))
}

// RecordTransaction records a financial transaction
func (m *ApplicationMetrics) RecordTransaction(ctx context.Context, transactionType string, amount float64, currency string) {
	attrs := []attribute.KeyValue{
		attribute.String("transaction_type", transactionType),
		attribute.String("currency", currency),
	}

	m.transactionCount.Add(ctx, 1, metric.WithAttributes(attrs...))
	m.transactionAmount.Record(ctx, amount, metric.WithAttributes(attrs...))
}

// UpdateActiveUsers updates the count of active users
func (m *ApplicationMetrics) UpdateActiveUsers(ctx context.Context, delta int64) {
	m.activeUsers.Add(ctx, delta)
}

// System metric methods

// UpdateSystemMetrics updates system-level metrics
func (m *ApplicationMetrics) UpdateSystemMetrics(ctx context.Context) {
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	// Update goroutine count
	m.goroutineCount.Add(ctx, int64(runtime.NumGoroutine()))

	// Update memory usage
	m.memoryUsage.Add(ctx, int64(memStats.Alloc))
}

// RecordGCDuration records garbage collection duration
func (m *ApplicationMetrics) RecordGCDuration(ctx context.Context, duration time.Duration) {
	m.gcDuration.Record(ctx, duration.Seconds())
}

// Error metric methods

// RecordError records an error occurrence
func (m *ApplicationMetrics) RecordError(ctx context.Context, errorType string, component string) {
	m.errorCount.Add(ctx, 1, metric.WithAttributes(
		attribute.String("error_type", errorType),
		attribute.String("component", component),
	))
}

// RecordPanic records a panic occurrence
func (m *ApplicationMetrics) RecordPanic(ctx context.Context, component string) {
	m.panicCount.Add(ctx, 1, metric.WithAttributes(
		attribute.String("component", component),
	))
}

// MetricsCollector handles periodic collection of system metrics
type MetricsCollector struct {
	metrics  *ApplicationMetrics
	interval time.Duration
	stopCh   chan struct{}
}

// NewMetricsCollector creates a new metrics collector
func NewMetricsCollector(metrics *ApplicationMetrics, interval time.Duration) *MetricsCollector {
	return &MetricsCollector{
		metrics:  metrics,
		interval: interval,
		stopCh:   make(chan struct{}),
	}
}

// Start begins collecting metrics at regular intervals
func (c *MetricsCollector) Start(ctx context.Context) {
	ticker := time.NewTicker(c.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.metrics.UpdateSystemMetrics(ctx)
		case <-c.stopCh:
			return
		case <-ctx.Done():
			return
		}
	}
}

// Stop stops the metrics collector
func (c *MetricsCollector) Stop() {
	close(c.stopCh)
}

// Global metrics instance
var globalMetrics *ApplicationMetrics

// InitGlobalMetrics initializes the global metrics instance
func InitGlobalMetrics() error {
	var err error
	globalMetrics, err = NewApplicationMetrics()
	return err
}

// GetGlobalMetrics returns the global metrics instance
func GetGlobalMetrics() *ApplicationMetrics {
	return globalMetrics
}

// Convenience functions using global metrics

// RecordUserRegistration records a user registration using global metrics
func RecordUserRegistration(ctx context.Context, userType string) {
	if globalMetrics != nil {
		globalMetrics.RecordUserRegistration(ctx, userType)
	}
}

// RecordUserLogin records a user login using global metrics
func RecordUserLogin(ctx context.Context, userID string, method string) {
	if globalMetrics != nil {
		globalMetrics.RecordUserLogin(ctx, userID, method)
	}
}

// RecordTransaction records a transaction using global metrics
func RecordTransaction(ctx context.Context, transactionType string, amount float64, currency string) {
	if globalMetrics != nil {
		globalMetrics.RecordTransaction(ctx, transactionType, amount, currency)
	}
}

// RecordError records an error using global metrics
func RecordError(ctx context.Context, errorType string, component string) {
	if globalMetrics != nil {
		globalMetrics.RecordError(ctx, errorType, component)
	}
}
