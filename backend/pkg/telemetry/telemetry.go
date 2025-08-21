package telemetry

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.34.0"
)

type TelemetryConfig struct {
	ServiceName    string
	ServiceVersion string
	Environment    string
	OTLPEndpoint   string
	Enabled        bool
}

type Telemetry struct {
	config         *TelemetryConfig
	traceProvider  *trace.TracerProvider
	metricProvider *metric.MeterProvider
	shutdownFuncs  []func(context.Context) error
}

// NewTelemetry creates a new telemetry instance with the given configuration
func NewTelemetry(config *TelemetryConfig) (*Telemetry, error) {
	if !config.Enabled {
		log.Println("Telemetry is disabled")
		return &Telemetry{config: config}, nil
	}

	t := &Telemetry{
		config:        config,
		shutdownFuncs: make([]func(context.Context) error, 0),
	}

	// Initialize resource
	res, err := t.initResource()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize resource: %w", err)
	}

	// Initialize trace provider
	if err := t.initTraceProvider(res); err != nil {
		return nil, fmt.Errorf("failed to initialize trace provider: %w", err)
	}

	// Initialize metric provider
	if err := t.initMetricProvider(res); err != nil {
		return nil, fmt.Errorf("failed to initialize metric provider: %w", err)
	}

	// Set global propagator
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	log.Printf("Telemetry initialized successfully for service: %s", config.ServiceName)
	return t, nil
}

// initResource creates the OpenTelemetry resource
func (t *Telemetry) initResource() (*resource.Resource, error) {
	return resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName(t.config.ServiceName),
			semconv.ServiceVersion(t.config.ServiceVersion),
			semconv.DeploymentEnvironmentName(t.config.Environment),
		),
	)
}

// initTraceProvider initializes the trace provider with OTLP exporter
func (t *Telemetry) initTraceProvider(res *resource.Resource) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Printf("Initializing trace provider with endpoint: %s", t.config.OTLPEndpoint)

	// Set environment variable for OTLP exporter
	os.Setenv("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", t.config.OTLPEndpoint+"/v1/traces")

	// Create OTLP trace exporter with minimal configuration
	traceExporter, err := otlptracehttp.New(ctx,
		otlptracehttp.WithInsecure(), // Use HTTPS in production
	)
	if err != nil {
		return fmt.Errorf("failed to create trace exporter: %w", err)
	}

	// Create trace provider
	t.traceProvider = trace.NewTracerProvider(
		trace.WithBatcher(traceExporter),
		trace.WithResource(res),
		trace.WithSampler(trace.AlwaysSample()), // Configure sampling as needed
	)

	// Set global trace provider
	otel.SetTracerProvider(t.traceProvider)

	// Add shutdown function
	t.shutdownFuncs = append(t.shutdownFuncs, t.traceProvider.Shutdown)

	return nil
}

// initMetricProvider initializes the metric provider with OTLP exporter
func (t *Telemetry) initMetricProvider(res *resource.Resource) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Printf("Initializing metric provider with endpoint: %s", t.config.OTLPEndpoint)

	// Set environment variable for OTLP exporter
	os.Setenv("OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", t.config.OTLPEndpoint+"/v1/metrics")

	// Create OTLP metric exporter with minimal configuration
	metricExporter, err := otlpmetrichttp.New(ctx,
		otlpmetrichttp.WithInsecure(), // Use HTTPS in production
	)
	if err != nil {
		return fmt.Errorf("failed to create metric exporter: %w", err)
	}

	// Create metric provider
	t.metricProvider = metric.NewMeterProvider(
		metric.WithResource(res),
		metric.WithReader(metric.NewPeriodicReader(metricExporter,
			metric.WithInterval(30*time.Second))), // Export metrics every 30 seconds
	)

	// Set global metric provider
	otel.SetMeterProvider(t.metricProvider)

	// Add shutdown function
	t.shutdownFuncs = append(t.shutdownFuncs, t.metricProvider.Shutdown)

	return nil
}

// Shutdown gracefully shuts down the telemetry providers
func (t *Telemetry) Shutdown(ctx context.Context) error {
	if !t.config.Enabled {
		return nil
	}

	var errors []error
	for _, shutdown := range t.shutdownFuncs {
		if err := shutdown(ctx); err != nil {
			errors = append(errors, err)
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("shutdown errors: %v", errors)
	}

	log.Println("Telemetry shutdown completed")
	return nil
}

// GetTraceProvider returns the trace provider
func (t *Telemetry) GetTraceProvider() *trace.TracerProvider {
	return t.traceProvider
}

// GetMetricProvider returns the metric provider
func (t *Telemetry) GetMetricProvider() *metric.MeterProvider {
	return t.metricProvider
}

// LoadConfigFromEnv loads telemetry configuration from environment variables
func LoadConfigFromEnv() *TelemetryConfig {
	return &TelemetryConfig{
		ServiceName:    getEnvOrDefault("OTEL_SERVICE_NAME", "finance-manager"),
		ServiceVersion: getEnvOrDefault("OTEL_SERVICE_VERSION", "1.0.0"),
		Environment:    getEnvOrDefault("ENVIRONMENT", "development"),
		OTLPEndpoint:   getEnvOrDefault("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318"),
		Enabled:        getEnvOrDefault("OTEL_ENABLED", "true") == "true",
	}
}

// getEnvOrDefault returns the environment variable value or a default value
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
