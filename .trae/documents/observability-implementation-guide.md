# OpenTelemetry & SigNoz Implementation Guide

## 1. Prerequisites and Setup

### 1.1 System Requirements

- **Docker**: Version 20.10+ with Docker Compose v2
- **Go**: Version 1.21+ for backend development
- **Node.js**: Version 18+ for frontend development
- **Memory**: Minimum 8GB RAM (16GB recommended for production)
- **Storage**: Minimum 20GB free space for ClickHouse data
- **Network**: Ports 3301, 4317, 4318, 8080, 9000, 9093 available

### 1.2 Directory Structure Setup

```bash
# Create observability configuration directories
mkdir -p observability/{otel,clickhouse,signoz,alertmanager,nginx,dashboards}
mkdir -p observability/scripts

# Create configuration files
touch observability/docker-compose.observability.yml
touch observability/.env.observability
touch observability/otel/otel-collector-config.yaml
touch observability/clickhouse/clickhouse-config.xml
touch observability/signoz/prometheus.yml
touch observability/alertmanager/config.yml
touch observability/nginx/nginx-otel.conf
```

## 2. Step-by-Step Implementation

### 2.1 Phase 1: Infrastructure Setup

#### Step 1: Create OpenTelemetry Collector Configuration

```yaml
# observability/otel/otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
        cors:
          allowed_origins:
            - "http://localhost:3000"
            - "http://localhost:5173"
            - "https://*.finance-manager.com"
          allowed_headers:
            - "*"
  
  prometheus:
    config:
      scrape_configs:
        - job_name: 'otel-collector'
          scrape_interval: 10s
          static_configs:
            - targets: ['0.0.0.0:8888']
        
        - job_name: 'finance-manager-backend'
          scrape_interval: 15s
          static_configs:
            - targets: ['backend:8080']
          metrics_path: '/metrics'
        
        - job_name: 'nginx'
          scrape_interval: 15s
          static_configs:
            - targets: ['nginx:9113']
          metrics_path: '/metrics'
        
        - job_name: 'redis'
          scrape_interval: 15s
          static_configs:
            - targets: ['redis:6379']
        
        - job_name: 'postgres'
          scrape_interval: 15s
          static_configs:
            - targets: ['postgres:5432']

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
    send_batch_max_size: 2048
  
  memory_limiter:
    limit_mib: 512
    spike_limit_mib: 128
    check_interval: 5s
  
  resource:
    attributes:
      - key: service.namespace
        value: finance-manager
        action: upsert
      - key: deployment.environment
        from_attribute: environment
        action: upsert
  
  attributes:
    actions:
      - key: http.user_agent
        action: delete
      - key: http.request.header.authorization
        action: delete
      - key: sensitive_data
        action: delete

exporters:
  clickhouse:
    endpoint: tcp://clickhouse:9000?dial_timeout=10s&compress=lz4
    database: signoz_traces
    username: signoz
    password: signoz
    ttl_days: 7
    logs_table_name: signoz_logs
    traces_table_name: signoz_index_v2
    metrics_table_name: signoz_metrics
  
  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: signoz
    const_labels:
      cluster: finance-manager
      environment: ${ENVIRONMENT}
  
  logging:
    loglevel: info

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, resource, attributes, batch]
      exporters: [clickhouse]
    
    metrics:
      receivers: [otlp, prometheus]
      processors: [memory_limiter, resource, batch]
      exporters: [clickhouse, prometheus]
    
    logs:
      receivers: [otlp]
      processors: [memory_limiter, resource, batch]
      exporters: [clickhouse]
  
  extensions: [health_check, pprof, zpages]
  
  telemetry:
    logs:
      level: info
    metrics:
      address: 0.0.0.0:8888
```

#### Step 2: Create ClickHouse Configuration

```xml
<!-- observability/clickhouse/clickhouse-config.xml -->
<?xml version="1.0"?>
<clickhouse>
    <logger>
        <level>information</level>
        <console>true</console>
    </logger>
    
    <http_port>8123</http_port>
    <tcp_port>9000</tcp_port>
    <mysql_port>9004</mysql_port>
    <postgresql_port>9005</postgresql_port>
    <interserver_http_port>9009</interserver_http_port>
    
    <listen_host>::</listen_host>
    
    <max_connections>4096</max_connections>
    <keep_alive_timeout>3</keep_alive_timeout>
    <max_concurrent_queries>100</max_concurrent_queries>
    <uncompressed_cache_size>8589934592</uncompressed_cache_size>
    <mark_cache_size>5368709120</mark_cache_size>
    
    <path>/var/lib/clickhouse/</path>
    <tmp_path>/var/lib/clickhouse/tmp/</tmp_path>
    <user_files_path>/var/lib/clickhouse/user_files/</user_files_path>
    <access_control_path>/var/lib/clickhouse/access/</access_control_path>
    
    <users_config>users.xml</users_config>
    
    <default_profile>default</default_profile>
    <default_database>default</default_database>
    
    <timezone>UTC</timezone>
    
    <mlock_executable>false</mlock_executable>
    
    <remote_servers>
        <signoz_cluster>
            <shard>
                <replica>
                    <host>clickhouse</host>
                    <port>9000</port>
                </replica>
            </shard>
        </signoz_cluster>
    </remote_servers>
    
    <zookeeper incl="zookeeper-servers" optional="true" />
    
    <macros incl="macros" optional="true" />
    
    <builtin_dictionaries_reload_interval>3600</builtin_dictionaries_reload_interval>
    
    <max_session_timeout>3600</max_session_timeout>
    <default_session_timeout>60</default_session_timeout>
    
    <query_log>
        <database>system</database>
        <table>query_log</table>
        <partition_by>toYYYYMM(event_date)</partition_by>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </query_log>
    
    <trace_log>
        <database>system</database>
        <table>trace_log</table>
        <partition_by>toYYYYMM(event_date)</partition_by>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </trace_log>
    
    <query_thread_log>
        <database>system</database>
        <table>query_thread_log</table>
        <partition_by>toYYYYMM(event_date)</partition_by>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </query_thread_log>
    
    <metric_log>
        <database>system</database>
        <table>metric_log</table>
        <partition_by>toYYYYMM(event_date)</partition_by>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </metric_log>
    
    <asynchronous_metric_log>
        <database>system</database>
        <table>asynchronous_metric_log</table>
        <partition_by>toYYYYMM(event_date)</partition_by>
        <flush_interval_milliseconds>7500</flush_interval_milliseconds>
    </asynchronous_metric_log>
    
    <openSSL>
        <server>
            <certificateFile>/etc/clickhouse-server/server.crt</certificateFile>
            <privateKeyFile>/etc/clickhouse-server/server.key</privateKeyFile>
            <dhParamsFile>/etc/clickhouse-server/dhparam.pem</dhParamsFile>
            <verificationMode>none</verificationMode>
            <loadDefaultCAFile>true</loadDefaultCAFile>
            <cacheSessions>true</cacheSessions>
            <disableProtocols>sslv2,sslv3</disableProtocols>
            <preferServerCiphers>true</preferServerCiphers>
        </server>
        <client>
            <loadDefaultCAFile>true</loadDefaultCAFile>
            <cacheSessions>true</cacheSessions>
            <disableProtocols>sslv2,sslv3</disableProtocols>
            <preferServerCiphers>true</preferServerCiphers>
            <verificationMode>none</verificationMode>
            <invalidCertificateHandler>
                <name>RejectCertificateHandler</name>
            </invalidCertificateHandler>
        </client>
    </openSSL>
</clickhouse>
```

#### Step 3: Create Deployment Script

```bash
#!/bin/bash
# observability/scripts/deploy-observability.sh

set -e

echo "🚀 Deploying Finance Manager Observability Stack"

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Set environment
ENVIRONMENT=${1:-development}
echo "📝 Environment: $ENVIRONMENT"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data/{clickhouse,signoz}
mkdir -p logs

# Load environment variables
if [ -f ".env.observability" ]; then
    echo "🔧 Loading environment variables..."
    export $(cat .env.observability | grep -v '^#' | xargs)
fi

# Validate required environment variables
required_vars=("CLICKHOUSE_PASSWORD" "SIGNOZ_ENDPOINT")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Pull latest images
echo "📥 Pulling latest images..."
docker-compose -f docker-compose.observability.yml pull

# Start infrastructure services first
echo "🏗️ Starting infrastructure services..."
docker-compose -f docker-compose.observability.yml up -d clickhouse

# Wait for ClickHouse to be ready
echo "⏳ Waiting for ClickHouse to be ready..."
until docker-compose -f docker-compose.observability.yml exec -T clickhouse clickhouse-client --query "SELECT 1" >/dev/null 2>&1; do
    echo "Waiting for ClickHouse..."
    sleep 5
done
echo "✅ ClickHouse is ready"

# Initialize ClickHouse databases
echo "🗄️ Initializing ClickHouse databases..."
docker-compose -f docker-compose.observability.yml exec -T clickhouse clickhouse-client --multiquery < scripts/init-clickhouse.sql

# Start OpenTelemetry Collector
echo "📊 Starting OpenTelemetry Collector..."
docker-compose -f docker-compose.observability.yml up -d otel-collector

# Wait for collector to be ready
echo "⏳ Waiting for OpenTelemetry Collector..."
until curl -f http://localhost:13133 >/dev/null 2>&1; do
    echo "Waiting for OpenTelemetry Collector..."
    sleep 3
done
echo "✅ OpenTelemetry Collector is ready"

# Start SigNoz services
echo "📈 Starting SigNoz services..."
docker-compose -f docker-compose.observability.yml up -d query-service signoz-frontend alertmanager

# Wait for SigNoz to be ready
echo "⏳ Waiting for SigNoz..."
until curl -f http://localhost:3301 >/dev/null 2>&1; do
    echo "Waiting for SigNoz..."
    sleep 5
done
echo "✅ SigNoz is ready"

# Import default dashboards
echo "📊 Importing default dashboards..."
if [ -d "dashboards" ]; then
    for dashboard in dashboards/*.json; do
        if [ -f "$dashboard" ]; then
            echo "Importing $(basename "$dashboard")..."
            curl -X POST \
                -H "Content-Type: application/json" \
                -d @"$dashboard" \
                "http://localhost:3301/api/v1/dashboards" || echo "Failed to import $(basename "$dashboard")"
        fi
    done
fi

# Setup alert rules
echo "🚨 Setting up alert rules..."
curl -X POST \
    -H "Content-Type: application/json" \
    -d @alertmanager/rules.json \
    "http://localhost:9093/api/v1/rules" || echo "Failed to setup alert rules"

# Display status
echo ""
echo "🎉 Observability stack deployed successfully!"
echo ""
echo "📊 SigNoz UI: http://localhost:3301"
echo "🔍 OpenTelemetry Collector: http://localhost:13133"
echo "🚨 AlertManager: http://localhost:9093"
echo "🗄️ ClickHouse: http://localhost:8123"
echo ""
echo "📝 Next steps:"
echo "1. Configure your applications to send telemetry data"
echo "2. Import custom dashboards"
echo "3. Set up notification channels"
echo "4. Test alert rules"
echo ""

# Show running services
echo "🔍 Running services:"
docker-compose -f docker-compose.observability.yml ps
```

### 2.2 Phase 2: Go Backend Implementation

#### Step 1: Add Dependencies

```bash
# Navigate to backend directory
cd backend

# Add OpenTelemetry dependencies
go get go.opentelemetry.io/otel@v1.21.0
go get go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc@v1.21.0
go get go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc@v0.44.0
go get go.opentelemetry.io/otel/exporters/prometheus@v0.44.0
go get go.opentelemetry.io/otel/sdk@v1.21.0
go get go.opentelemetry.io/otel/sdk/metric@v1.21.0
go get go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin@v0.46.1
go get go.opentelemetry.io/contrib/instrumentation/database/sql/otelsql@v0.46.1
go get go.opentelemetry.io/contrib/instrumentation/github.com/go-redis/redis/v8/otelredis@v0.46.1
```

#### Step 2: Create Telemetry Package

```go
// pkg/telemetry/telemetry.go
package telemetry

import (
    "context"
    "fmt"
    "log"
    "time"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
    "go.opentelemetry.io/otel/exporters/prometheus"
    "go.opentelemetry.io/otel/metric"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    sdkmetric "go.opentelemetry.io/otel/sdk/metric"
    semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
    "go.opentelemetry.io/otel/trace"
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
)

type Config struct {
    ServiceName     string
    ServiceVersion  string
    Environment     string
    OTLPEndpoint    string
    SamplingRate    float64
    EnableMetrics   bool
    EnableTracing   bool
    EnableLogging   bool
}

type Telemetry struct {
    tracer         trace.Tracer
    meter          metric.Meter
    traceProvider  *sdktrace.TracerProvider
    metricProvider *sdkmetric.MeterProvider
    config         Config
}

func New(config Config) (*Telemetry, error) {
    ctx := context.Background()
    
    // Create resource
    res, err := resource.New(ctx,
        resource.WithAttributes(
            semconv.ServiceName(config.ServiceName),
            semconv.ServiceVersion(config.ServiceVersion),
            semconv.DeploymentEnvironment(config.Environment),
            attribute.String("service.namespace", "finance-manager"),
        ),
    )
    if err != nil {
        return nil, fmt.Errorf("failed to create resource: %w", err)
    }

    var traceProvider *sdktrace.TracerProvider
    var metricProvider *sdkmetric.MeterProvider

    // Setup tracing if enabled
    if config.EnableTracing {
        traceProvider, err = setupTracing(ctx, config, res)
        if err != nil {
            return nil, fmt.Errorf("failed to setup tracing: %w", err)
        }
        otel.SetTracerProvider(traceProvider)
        otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
            propagation.TraceContext{},
            propagation.Baggage{},
        ))
    }

    // Setup metrics if enabled
    if config.EnableMetrics {
        metricProvider, err = setupMetrics(ctx, config, res)
        if err != nil {
            return nil, fmt.Errorf("failed to setup metrics: %w", err)
        }
        otel.SetMeterProvider(metricProvider)
    }

    tracer := otel.Tracer(config.ServiceName)
    meter := otel.Meter(config.ServiceName)

    log.Printf("Telemetry initialized for service: %s", config.ServiceName)

    return &Telemetry{
        tracer:         tracer,
        meter:          meter,
        traceProvider:  traceProvider,
        metricProvider: metricProvider,
        config:         config,
    }, nil
}

func setupTracing(ctx context.Context, config Config, res *resource.Resource) (*sdktrace.TracerProvider, error) {
    conn, err := grpc.DialContext(ctx, config.OTLPEndpoint,
        grpc.WithTransportCredentials(insecure.NewCredentials()),
        grpc.WithBlock(),
    )
    if err != nil {
        return nil, fmt.Errorf("failed to create gRPC connection to collector: %w", err)
    }

    traceExporter, err := otlptracegrpc.New(ctx, otlptracegrpc.WithGRPCConn(conn))
    if err != nil {
        return nil, fmt.Errorf("failed to create trace exporter: %w", err)
    }

    // Configure sampling
    var sampler sdktrace.Sampler
    if config.SamplingRate >= 1.0 {
        sampler = sdktrace.AlwaysSample()
    } else if config.SamplingRate <= 0.0 {
        sampler = sdktrace.NeverSample()
    } else {
        sampler = sdktrace.TraceIDRatioBased(config.SamplingRate)
    }

    traceProvider := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(traceExporter,
            sdktrace.WithMaxExportBatchSize(512),
            sdktrace.WithBatchTimeout(5*time.Second),
            sdktrace.WithMaxQueueSize(2048),
        ),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sampler),
    )

    return traceProvider, nil
}

func setupMetrics(ctx context.Context, config Config, res *resource.Resource) (*sdkmetric.MeterProvider, error) {
    conn, err := grpc.DialContext(ctx, config.OTLPEndpoint,
        grpc.WithTransportCredentials(insecure.NewCredentials()),
        grpc.WithBlock(),
    )
    if err != nil {
        return nil, fmt.Errorf("failed to create gRPC connection to collector: %w", err)
    }

    metricExporter, err := otlpmetricgrpc.New(ctx, otlpmetricgrpc.WithGRPCConn(conn))
    if err != nil {
        return nil, fmt.Errorf("failed to create metric exporter: %w", err)
    }

    // Prometheus exporter for pull-based metrics
    promExporter, err := prometheus.New()
    if err != nil {
        return nil, fmt.Errorf("failed to create prometheus exporter: %w", err)
    }

    metricProvider := sdkmetric.NewMeterProvider(
        sdkmetric.WithReader(sdkmetric.NewPeriodicReader(metricExporter,
            sdkmetric.WithInterval(15*time.Second))),
        sdkmetric.WithReader(promExporter),
        sdkmetric.WithResource(res),
    )

    return metricProvider, nil
}

func (t *Telemetry) Tracer() trace.Tracer {
    return t.tracer
}

func (t *Telemetry) Meter() metric.Meter {
    return t.meter
}

func (t *Telemetry) Shutdown(ctx context.Context) error {
    var errs []error
    
    if t.traceProvider != nil {
        if err := t.traceProvider.Shutdown(ctx); err != nil {
            errs = append(errs, fmt.Errorf("failed to shutdown trace provider: %w", err))
        }
    }
    
    if t.metricProvider != nil {
        if err := t.metricProvider.Shutdown(ctx); err != nil {
            errs = append(errs, fmt.Errorf("failed to shutdown metric provider: %w", err))
        }
    }
    
    if len(errs) > 0 {
        return fmt.Errorf("shutdown errors: %v", errs)
    }
    
    return nil
}

// Helper functions for common operations
func (t *Telemetry) StartSpan(ctx context.Context, name string, opts ...trace.SpanStartOption) (context.Context, trace.Span) {
    return t.tracer.Start(ctx, name, opts...)
}

func (t *Telemetry) RecordError(span trace.Span, err error, description string) {
    span.RecordError(err)
    span.SetStatus(trace.StatusError, description)
}

func (t *Telemetry) AddEvent(span trace.Span, name string, attributes ...attribute.KeyValue) {
    span.AddEvent(name, trace.WithAttributes(attributes...))
}
```

#### Step 3: Update Main Application

```go
// cmd/server/main.go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "strconv"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
    
    "finance-manager/internal/config"
    "finance-manager/internal/database"
    "finance-manager/internal/middleware"
    "finance-manager/internal/routes"
    "finance-manager/pkg/telemetry"
)

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Printf("Warning: Error loading .env file: %v", err)
    }

    // Load configuration
    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("Failed to load configuration: %v", err)
    }

    // Initialize telemetry
    telemetryConfig := telemetry.Config{
        ServiceName:     "finance-manager-backend",
        ServiceVersion:  "1.0.0",
        Environment:     cfg.Environment,
        OTLPEndpoint:    getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317"),
        SamplingRate:    getEnvAsFloat("TRACE_SAMPLING_RATE", 0.1),
        EnableMetrics:   true,
        EnableTracing:   true,
        EnableLogging:   true,
    }

    tel, err := telemetry.New(telemetryConfig)
    if err != nil {
        log.Fatalf("Failed to initialize telemetry: %v", err)
    }
    defer func() {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()
        if err := tel.Shutdown(ctx); err != nil {
            log.Printf("Error shutting down telemetry: %v", err)
        }
    }()

    // Initialize database with instrumentation
    db, err := database.NewInstrumentedDB(cfg.Database.DSN())
    if err != nil {
        log.Fatalf("Failed to connect to database: %v", err)
    }
    defer db.Close()

    // Initialize Redis with instrumentation
    redisClient := redis.NewInstrumentedClient(cfg.Redis)
    defer redisClient.Close()

    // Initialize Gin with telemetry middleware
    if cfg.Environment == "production" {
        gin.SetMode(gin.ReleaseMode)
    }

    router := gin.New()
    
    // Add telemetry middleware
    router.Use(otelgin.Middleware("finance-manager-backend"))
    router.Use(middleware.NewTelemetryMiddleware().Handler())
    router.Use(middleware.Logger())
    router.Use(middleware.Recovery())
    router.Use(middleware.CORS())

    // Setup routes
    routes.SetupRoutes(router, db, redisClient, tel)

    // Create HTTP server
    srv := &http.Server{
        Addr:    ":" + strconv.Itoa(cfg.Server.Port),
        Handler: router,
    }

    // Start server in a goroutine
    go func() {
        log.Printf("Server starting on port %d", cfg.Server.Port)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Failed to start server: %v", err)
        }
    }()

    // Wait for interrupt signal to gracefully shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("Shutting down server...")

    // Graceful shutdown with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatalf("Server forced to shutdown: %v", err)
    }

    log.Println("Server exited")
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvAsFloat(key string, defaultValue float64) float64 {
    if value := os.Getenv(key); value != "" {
        if parsed, err := strconv.ParseFloat(value, 64); err == nil {
            return parsed
        }
    }
    return defaultValue
}
```

### 2.3 Phase 3: TypeScript Frontend Implementation

#### Step 1: Add Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Add OpenTelemetry dependencies
npm install @opentelemetry/api@^1.7.0 \
  @opentelemetry/sdk-web@^1.18.1 \
  @opentelemetry/auto-instrumentations-web@^0.35.0 \
  @opentelemetry/exporter-otlp-http@^0.45.1 \
  @opentelemetry/instrumentation-fetch@^0.45.1 \
  @opentelemetry/instrumentation-xml-http-request@^0.45.1 \
  @opentelemetry/instrumentation-user-interaction@^0.35.1 \
  @opentelemetry/instrumentation-document-load@^0.35.1 \
  @opentelemetry/context-zone@^1.18.1 \
  @opentelemetry/propagator-b3@^1.18.1 \
  @opentelemetry/propagator-jaeger@^1.18.1 \
  @opentelemetry/resources@^1.18.1 \
  @opentelemetry/semantic-conventions@^1.18.1
```

#### Step 2: Create Telemetry Service

```typescript
// src/lib/telemetry/index.ts
import { WebSDK } from '@opentelemetry/sdk-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { ZoneContextManager } from '@opentelemetry/context-zone';

interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  otlpEndpoint: string;
  enableConsoleExporter?: boolean;
  samplingRate?: number;
  enableUserInteraction?: boolean;
  enableDocumentLoad?: boolean;
}

class TelemetryService {
  private sdk: WebSDK | null = null;
  private config: TelemetryConfig;
  private isInitialized = false;

  constructor(config: TelemetryConfig) {
    this.config = {
      samplingRate: 0.1,
      enableUserInteraction: true,
      enableDocumentLoad: true,
      ...config,
    };
  }

  initialize(): void {
    if (this.isInitialized) {
      console.warn('Telemetry already initialized');
      return;
    }

    try {
      const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
        'service.namespace': 'finance-manager',
        'telemetry.sdk.name': 'opentelemetry',
        'telemetry.sdk.language': 'webjs',
        'telemetry.sdk.version': '1.18.1',
      });

      const traceExporter = new OTLPTraceExporter({
        url: `${this.config.otlpEndpoint}/v1/traces`,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.sdk = new WebSDK({
        resource,
        traceExporter,
        instrumentations: [
          getWebAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': {
              enabled: false,
            },
            '@opentelemetry/instrumentation-fetch': {
              enabled: true,
              propagateTraceHeaderCorsUrls: [
                new RegExp(`${window.location.origin}/api/.*`),
                /^https:\/\/api\.finance-manager\..*/,
                /^http:\/\/localhost:8080\/api\/.*/,
              ],
              clearTimingResources: true,
              applyCustomAttributesOnSpan: (span, request, result) => {
                const requestSize = this.getRequestSize(request);
                const responseSize = this.getResponseSize(result);
                
                span.setAttributes({
                  'http.request.body.size': requestSize,
                  'http.response.body.size': responseSize,
                  'http.user_agent': navigator.userAgent,
                  'browser.name': this.getBrowserName(),
                  'browser.version': this.getBrowserVersion(),
                });
              },
            },
            '@opentelemetry/instrumentation-xml-http-request': {
              enabled: true,
              propagateTraceHeaderCorsUrls: [
                new RegExp(`${window.location.origin}/api/.*`),
                /^http:\/\/localhost:8080\/api\/.*/,
              ],
            },
            '@opentelemetry/instrumentation-user-interaction': {
              enabled: this.config.enableUserInteraction,
              eventNames: ['click', 'submit', 'keydown', 'change'],
            },
            '@opentelemetry/instrumentation-document-load': {
              enabled: this.config.enableDocumentLoad,
            },
          }),
        ],
        contextManager: new ZoneContextManager(),
        textMapPropagator: new CompositePropagator({
          propagators: [
            new W3CTraceContextPropagator(),
            new B3Propagator(),
            new JaegerPropagator(),
          ],
        }),
      });

      this.sdk.start();
      this.isInitialized = true;
      
      console.log('✅ OpenTelemetry initialized successfully');
      
      // Track initial page load
      this.trackPageLoad();
      
    } catch (error) {
      console.error('❌ Failed to initialize OpenTelemetry:', error);
    }
  }

  private getRequestSize(request: Request | RequestInit): number {
    if ('body' in request && request.body) {
      if (typeof request.body === 'string') {
        return new Blob([request.body]).size;
      }
      if (request.body instanceof FormData) {
        // Approximate size for FormData
        return 1024; // Default estimate
      }
    }
    return 0;
  }

  private getResponseSize(result: Response | XMLHttpRequest): number {
    if (result instanceof Response) {
      const contentLength = result.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    }
    return 0;
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([\d.]+)/);
    return match ? match[2] : 'Unknown';
  }

  private trackPageLoad(): void {
    // Track initial page load metrics
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        const firstPaint = this.getFirstPaint();
        
        console.log('📊 Page Load Metrics:', {
          loadTime,
          domContentLoaded,
          firstPaint,
        });
      }
    }
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  shutdown(): Promise<void> {
    if (this.sdk) {
      this.isInitialized = false;
      return this.sdk.shutdown();
    }
    return Promise.resolve();
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Create and export telemetry instance
const telemetryConfig: TelemetryConfig = {
  serviceName: 'finance-manager-frontend',
  serviceVersion: '1.0.0',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  otlpEndpoint: import.meta.env.VITE_OTEL_ENDPOINT || 'http://localhost:4318',
  enableConsoleExporter: import.meta.env.VITE_ENVIRONMENT === 'development',
  samplingRate: parseFloat(import.meta.env.VITE_TRACE_SAMPLING_RATE || '0.1'),
};

export const telemetryService = new TelemetryService(telemetryConfig);

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      telemetryService.initialize();
    });
  } else {
    telemetryService.initialize();
  }
}

export default telemetryService;
```

#### Step 3: Create Custom Instrumentation Hooks

```typescript
// src/lib/telemetry/hooks.ts
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { useEffect, useCallback } from 'react';

const tracer = trace.getTracer('finance-manager-frontend', '1.0.0');

// Hook for tracking page views
export function usePageTracking(pageName: string, additionalAttributes?: Record<string, any>) {
  useEffect(() => {
    const span = tracer.startSpan(`page.view`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'page.name': pageName,
        'page.url': window.location.href,
        'page.referrer': document.referrer,
        'page.title': document.title,
        'user.agent': navigator.userAgent,
        ...additionalAttributes,
      },
    });
    
    span.addEvent('page.loaded');
    span.end();

    // Track page unload
    const handleUnload = () => {
      const unloadSpan = tracer.startSpan(`page.unload`, {
        kind: SpanKind.CLIENT,
        attributes: {
          'page.name': pageName,
          'page.url': window.location.href,
        },
      });
      unloadSpan.end();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [pageName, additionalAttributes]);
}

// Hook for tracking API calls
export function useApiTracking() {
  const trackApiCall = useCallback(async <T>(
    operationName: string,
    apiCall: () => Promise<T>,
    attributes: Record<string, any> = {}
  ): Promise<T> => {
    const span = tracer.startSpan(`api.${operationName}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'api.operation': operationName,
        'api.timestamp': Date.now(),
        ...attributes,
      },
    });

    const startTime = performance.now();

    try {
      span.addEvent('api.request.start');
      const result = await context.with(trace.setSpan(context.active(), span), apiCall);
      
      const duration = performance.now() - startTime;
      span.setAttributes({
        'api.duration_ms': duration,
        'api.success': true,
      });
      span.addEvent('api.request.success', {
        'api.duration_ms': duration,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      span.setAttributes({
        'api.duration_ms': duration,
        'api.success': false,
        'api.error': true,
      });
      span.recordException(error as Error);
      span.addEvent('api.request.error', {
        'api.duration_ms': duration,
        'error.message': (error as Error).message,
      });
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      throw error;
    } finally {
      span.end();
    }
  }, []);

  return { trackApiCall };
}

// Hook for tracking user interactions
export function useUserInteractionTracking() {
  const trackUserAction = useCallback((actionName: string, attributes: Record<string, any> = {}) => {
    const span = tracer.startSpan(`user.${actionName}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'user.action': actionName,
        'user.timestamp': Date.now(),
        'page.url': window.location.href,
        ...attributes,
      },
    });

    return {
      end: (error?: Error) => {
        if (error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }
        span.end();
      },
      addEvent: (name: string, eventAttributes?: Record<string, any>) => {
        span.addEvent(name, eventAttributes);
      },
      setAttributes: (spanAttributes: Record<string, any>) => {
        span.setAttributes(spanAttributes);
      },
    };
  }, []);

  const trackFormSubmission = useCallback((formName: string, success: boolean, attributes: Record<string, any> = {}) => {
    const span = tracer.startSpan(`form.submit`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'form.name': formName,
        'form.success': success,
        'form.timestamp': Date.now(),
        ...attributes,
      },
    });
    
    span.setStatus({ 
      code: success ? SpanStatusCode.OK : SpanStatusCode.ERROR 
    });
    span.end();
  }, []);

  const trackButtonClick = useCallback((buttonName: string, attributes: Record<string, any> = {}) => {
    const span = tracer.startSpan(`button.click`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'button.name': buttonName,
        'button.timestamp': Date.now(),
        ...attributes,
      },
    });
    span.end();
  }, []);

  return {
    trackUserAction,
    trackFormSubmission,
    trackButtonClick,
  };
}

// Hook for tracking performance metrics
export function usePerformanceTracking() {
  const trackPerformance = useCallback((metricName: string, value: number, attributes: Record<string, any> = {}) => {
    const span = tracer.startSpan(`performance.${metricName}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'performance.metric': metricName,
        'performance.value': value,
        'performance.timestamp': Date.now(),
        ...attributes,
      },
    });
    span.end();
  }, []);

  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    trackPerformance('component.render', renderTime, {
      'component.name': componentName,
    });
  }, [trackPerformance]);

  const trackRouteChange = useCallback((fromRoute: string, toRoute: string, duration: number) => {
    const span = tracer.startSpan(`route.change`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'route.from': fromRoute,
        'route.to': toRoute,
        'route.duration_ms': duration,
        'route.timestamp': Date.now(),
      },
    });
    span.end();
  }, []);

  return {
    trackPerformance,
    trackComponentRender,
    trackRouteChange,
  };
}
```

## 3. Testing and Validation

### 3.1 Create Test Scripts

```bash
#!/bin/bash
# observability/scripts/test-observability.sh

set -e

echo "🧪 Testing Observability Stack"

# Test OpenTelemetry Collector health
echo "📊 Testing OpenTelemetry Collector..."
if curl -f http://localhost:13133 >/dev/null 2>&1; then
    echo "✅ OpenTelemetry Collector is healthy"
else
    echo "❌ OpenTelemetry Collector is not responding"
    exit 1
fi

# Test ClickHouse connection
echo "🗄️ Testing ClickHouse..."
if docker-compose -f docker-compose.observability.yml exec -T clickhouse clickhouse-client --query "SELECT 1" >/dev/null 2>&1; then
    echo "✅ ClickHouse is healthy"
else
    echo "❌ ClickHouse is not responding"
    exit 1
fi

# Test SigNoz frontend
echo "📈 Testing SigNoz..."
if curl -f http://localhost:3301 >/dev/null 2>&1; then
    echo "✅ SigNoz is healthy"
else
    echo "❌ SigNoz is not responding"
    exit 1
fi

# Test AlertManager
echo "🚨 Testing AlertManager..."
if curl -f http://localhost:9093/-/healthy >/dev/null 2>&1; then
    echo "✅ AlertManager is healthy"
else
    echo "❌ AlertManager is not responding"
    exit 1
fi

# Send test trace
echo "📤 Sending test trace..."
curl -X POST http://localhost:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d '{
    "resourceSpans": [{
      "resource": {
        "attributes": [{
          "key": "service.name",
          "value": {"stringValue": "test-service"}
        }]
      },
      "scopeSpans": [{
        "spans": [{
          "traceId": "5B8EFFF798038103D269B633813FC60C",
          "spanId": "EEE19B7EC3C1B174",
          "name": "test-span",
          "startTimeUnixNano": "1544712660000000000",
          "endTimeUnixNano": "1544712661000000000",
          "attributes": [{
            "key": "test.attribute",
            "value": {"stringValue": "test-value"}
          }]
        }]
      }]
    }]
  }' || echo "Failed to send test trace"

# Send test metric
echo "📊 Sending test metric..."
curl -X POST http://localhost:4318/v1/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "resourceMetrics": [{
      "resource": {
        "attributes": [{
          "key": "service.name",
          "value": {"stringValue": "test-service"}
        }]
      },
      "scopeMetrics": [{
        "metrics": [{
          "name": "test_counter",
          "description": "Test counter metric",
          "unit": "1",
          "sum": {
            "dataPoints": [{
              "timeUnixNano": "1544712660000000000",
              "asInt": "42",
              "attributes": [{
                "key": "test.label",
                "value": {"stringValue": "test-value"}
              }]
            }],
            "aggregationTemporality": 2,
            "isMonotonic": true
          }
        }]
      }]
    }]
  }' || echo "Failed to send test metric"

echo ""
echo "🎉 All tests passed! Observability stack is working correctly."
echo ""
echo "📊 Access SigNoz UI: http://localhost:3301"
echo "🔍 View traces and metrics in the SigNoz dashboard"
```

### 3.2 Create Load Testing Script

```bash
#!/bin/bash
# observability/scripts/load-test.sh

set -e

echo "🚀 Running Load Test for Observability"

# Check if hey is installed
if ! command -v hey &> /dev/null; then
    echo "Installing hey load testing tool..."
    go install github.com/rakyll/hey@latest
fi

# Test backend API with telemetry
echo "📊 Load testing backend API..."
hey -n 1000 -c 10 -m GET http://localhost:8080/api/health

# Test frontend with telemetry
echo "🌐 Load testing frontend..."
hey -n 500 -c 5 -m GET http://localhost:3000

# Generate various API calls
echo "🔄 Generating diverse API traffic..."
for i in {1..50}; do
    # Simulate different API endpoints
    curl -s http://localhost:8080/api/accounts >/dev/null &
    curl -s http://localhost:8080/api/transactions >/dev/null &
    curl -s http://localhost:8080/api/reports >/dev/null &
    
    # Simulate some errors
    if [ $((i % 10)) -eq 0 ]; then
        curl -s http://localhost:8080/api/nonexistent >/dev/null &
    fi
    
    sleep 0.1
done

wait

echo ""
echo "✅ Load test completed!"
echo "📊 Check SigNoz dashboard for metrics: http://localhost:3301"
echo "🔍 Look for:"
echo "  - Request rate and latency metrics"
echo "  - Error rate spikes"
echo "  - Distributed traces"
echo "  - Service dependencies"
```

## 4. Monitoring and Maintenance

### 4.1 Health Check Script

```bash
#!/bin/bash
# observability/scripts/health-check.sh

set -e

echo "🏥 Observability Stack Health Check"
echo "================================="

# Function to check service health
check_service() {
    local service_name=$1
    local health_url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name... "
    
    if response=$(curl -s -w "%{http_code}" -o /dev/null "$health_url" 2>/dev/null); then
        if [ "$response" -eq "$expected_status" ]; then
            echo "✅ Healthy (HTTP $response)"
            return 0
        else
            echo "⚠️ Unhealthy (HTTP $response)"
            return 1
        fi
    else
        echo "❌ Unreachable"
        return 1
    fi
}

# Function to check Docker container status
check_container() {
    local container_name=$1
    echo -n "Checking container $container_name... "
    
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name.*Up"; then
        echo "✅ Running"
        return 0
    else
        echo "❌ Not running"
        return 1
    fi
}

# Function to check disk usage
check_disk_usage() {
    echo "💾 Disk Usage:"
    df -h | grep -E "(clickhouse|signoz)" || echo "No observability volumes found"
    echo ""
}

# Function to check memory usage
check_memory_usage() {
    echo "🧠 Memory Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep -E "(clickhouse|signoz|otel)"
    echo ""
}

# Main health checks
echo "🐳 Container Status:"
check_container "signoz-clickhouse"
check_container "otel-collector"
check_container "signoz-query-service"
check_container "signoz-frontend"
check_container "signoz-alertmanager"
echo ""

echo "🌐 Service Health:"
check_service "ClickHouse" "http://localhost:8123/ping"
check_service "OpenTelemetry Collector" "http://localhost:13133"
check_service "SigNoz Query Service" "http://localhost:8080/api/v1/health"
check_service "SigNoz Frontend" "http://localhost:3301"
check_service "AlertManager" "http://localhost:9093/-/healthy"
echo ""

check_disk_usage
check_memory_usage

# Check recent logs for errors
echo "📋 Recent Error Logs:"
echo "ClickHouse errors:"
docker logs signoz-clickhouse --since=1h 2>&1 | grep -i error | tail -5 || echo "No recent errors"
echo ""
echo "OpenTelemetry Collector errors:"
docker logs otel-collector --since=1h 2>&1 | grep -i error | tail -5 || echo "No recent errors"
echo ""

# Check data ingestion
echo "📊 Data Ingestion Check:"
echo "Recent traces count:"
docker exec signoz-clickhouse clickhouse-client --query "SELECT count() FROM signoz_traces.signoz_index_v2 WHERE timestamp > now() - INTERVAL 1 HOUR" 2>/dev/null || echo "Failed to query traces"
echo "Recent metrics count:"
docker exec signoz-clickhouse clickhouse-client --query "SELECT count() FROM signoz_metrics.samples WHERE timestamp > now() - INTERVAL 1 HOUR" 2>/dev/null || echo "Failed to query metrics"

echo ""
echo "🎯 Overall Health Status:"
if [ $? -eq 0 ]; then
    echo "✅ Observability stack is healthy"
    exit 0
else
    echo "❌ Some issues detected in observability stack"
    exit 1
fi
```

### 4.2 Backup and Recovery

```bash
#!/bin/bash
# observability/scripts/backup.sh

set -e

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup in $BACKUP_DIR"

mkdir -p "$BACKUP_DIR"

# Backup ClickHouse data
echo "🗄️ Backing up ClickHouse data..."
docker exec signoz-clickhouse clickhouse-client --query "BACKUP DATABASE signoz_traces TO Disk('backups', 'traces_$(date +%Y%m%d).zip')"
docker exec signoz-clickhouse clickhouse-client --query "BACKUP DATABASE signoz_metrics TO Disk('backups', 'metrics_$(date +%Y%m%d).zip')"

# Backup configuration files
echo "⚙️ Backing up configuration..."
cp -r observability/ "$BACKUP_DIR/config/"
cp docker-compose.observability.yml "$BACKUP_DIR/"
cp .env.observability "$BACKUP_DIR/"

# Backup dashboards
echo "📊 Backing up dashboards..."
mkdir -p "$BACKUP_DIR/dashboards"
curl -s "http://localhost:3301/api/v1/dashboards" > "$BACKUP_DIR/dashboards/dashboards.json"

# Backup alert rules
echo "🚨 Backing up alert rules..."
mkdir -p "$BACKUP_DIR/alerts"
curl -s "http://localhost:9093/api/v1/rules" > "$BACKUP_DIR/alerts/rules.json"

echo "✅ Backup completed: $BACKUP_DIR"
```

## 5. Troubleshooting Guide

### 5.1 Common Issues and Solutions

#### Issue: OpenTelemetry Collector Not Receiving Data

**Symptoms:**
- No traces/metrics appearing in SigNoz
- Collector health check fails
- Application logs show connection errors

**Solutions:**
```bash
# Check collector logs
docker logs otel-collector --tail=50

# Verify collector configuration
docker exec otel-collector cat /etc/otel-collector-config.yaml

# Test collector endpoints
curl -v http://localhost:4317  # gRPC endpoint
curl -v http://localhost:4318  # HTTP endpoint

# Restart collector
docker-compose -f docker-compose.observability.yml restart otel-collector
```

#### Issue: ClickHouse Connection Problems

**Symptoms:**
- SigNoz shows "Database connection error"
- Query service fails to start
- Data not persisting

**Solutions:**
```bash
# Check ClickHouse status
docker exec signoz-clickhouse clickhouse-client --query "SELECT version()"

# Check disk space
df -h

# Verify ClickHouse configuration
docker exec signoz-clickhouse cat /etc/clickhouse-server/config.xml

# Reset ClickHouse data (WARNING: This will delete all data)
docker-compose -f docker-compose.observability.yml down
docker volume rm signoz_clickhouse_data
docker-compose -f docker-compose.observability.yml up -d
```

#### Issue: High Memory Usage

**Symptoms:**
- System becomes slow
- Docker containers getting killed
- Out of memory errors

**Solutions:**
```bash
# Check memory usage
docker stats --no-stream

# Reduce ClickHouse memory settings
# Edit observability/clickhouse/clickhouse-config.xml
<max_memory_usage>4000000000</max_memory_usage>
<max_bytes_before_external_group_by>2000000000</max_bytes_before_external_group_by>

# Reduce collector batch sizes
# Edit observability/otel/otel-collector-config.yaml
processors:
  batch:
    timeout: 5s
    send_batch_size: 512
    send_batch_max_size: 1024
```

### 5.2 Performance Optimization

#### ClickHouse Optimization

```xml
<!-- Add to clickhouse-config.xml -->
<profiles>
    <default>
        <max_memory_usage>8000000000</max_memory_usage>
        <use_uncompressed_cache>1</use_uncompressed_cache>
        <load_balancing>random</load_balancing>
        <max_execution_time>300</max_execution_time>
        <max_concurrent_queries_for_user>10</max_concurrent_queries_for_user>
    </default>
</profiles>
```

#### OpenTelemetry Collector Optimization

```yaml
# Add to otel-collector-config.yaml
processors:
  batch:
    timeout: 2s
    send_batch_size: 2048
    send_batch_max_size: 4096
  
  memory_limiter:
    limit_mib: 1024
    spike_limit_mib: 256
    check_interval: 2s
  
  resource:
    attributes:
      - key: environment
        value: ${ENVIRONMENT}
        action: upsert
```

## 6. Migration Checklist

### 6.1 Pre-Migration Steps

- [ ] **Backup existing monitoring setup**
  - Export current dashboards
  - Save alert configurations
  - Document current metrics and thresholds

- [ ] **Infrastructure preparation**
  - Verify system requirements (8GB+ RAM, 20GB+ storage)
  - Ensure Docker and Docker Compose are updated
  - Check network port availability (3301, 4317, 4318, 8080, 9000, 9093)

- [ ] **Environment setup**
  - Create `.env.observability` file
  - Configure OTEL endpoints in application configs
  - Set up SSL certificates if needed

### 6.2 Migration Steps

- [ ] **Phase 1: Infrastructure deployment**
  - Deploy ClickHouse and OpenTelemetry Collector
  - Verify basic connectivity
  - Run health checks

- [ ] **Phase 2: Backend instrumentation**
  - Add OpenTelemetry dependencies to Go backend
  - Implement telemetry package
  - Update main.go with instrumentation
  - Test trace and metric generation

- [ ] **Phase 3: Frontend instrumentation**
  - Add OpenTelemetry dependencies to TypeScript frontend
  - Implement telemetry service
  - Add custom hooks for tracking
  - Test browser telemetry

- [ ] **Phase 4: SigNoz deployment**
  - Deploy SigNoz query service and frontend
  - Configure dashboards and alerts
  - Import existing monitoring configurations
  - Validate data flow

### 6.3 Post-Migration Validation

- [ ] **Data validation**
  - Verify traces are appearing in SigNoz
  - Check metric collection and aggregation
  - Validate log ingestion
  - Test alert firing

- [ ] **Performance validation**
  - Run load tests
  - Monitor system resource usage
  - Verify application performance impact
  - Check data retention policies

- [ ] **Team training**
  - Train team on SigNoz UI
  - Document new monitoring workflows
  - Update runbooks and procedures
  - Set up notification channels

## 7. Success Metrics

### 7.1 Technical Metrics

- **Observability Coverage**: 100% of services instrumented
- **Data Completeness**: >95% trace completion rate
- **Performance Impact**: <5% application latency increase
- **System Reliability**: 99.9% observability stack uptime
- **Data Retention**: 30 days traces, 90 days metrics

### 7.2 Operational Metrics

- **Mean Time to Detection (MTTD)**: <5 minutes
- **Mean Time to Resolution (MTTR)**: <30 minutes
- **Alert Accuracy**: >90% true positive rate
- **Dashboard Usage**: Daily active users >80% of team
- **Query Performance**: <2 seconds average query time

### 7.3 Business Metrics

- **Incident Reduction**: 50% fewer production incidents
- **Debugging Efficiency**: 70% faster issue resolution
- **System Understanding**: Improved service dependency visibility
- **Proactive Monitoring**: 80% of issues detected before user impact

---

**Next Steps:**
1. Review and customize configurations for your environment
2. Execute the migration plan in phases
3. Monitor and optimize based on actual usage patterns
4. Continuously improve dashboards and alerts based on team feedback