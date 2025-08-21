package telemetry

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/trace"
)

// HTTPMetrics holds the HTTP-related metrics
type HTTPMetrics struct {
	requestDuration metric.Float64Histogram
	requestCount    metric.Int64Counter
	responseSize    metric.Int64Histogram
}

// NewHTTPMetrics creates new HTTP metrics
func NewHTTPMetrics() (*HTTPMetrics, error) {
	meter := otel.Meter("finance-manager/http")

	requestDuration, err := meter.Float64Histogram(
		"http_request_duration_seconds",
		metric.WithDescription("Duration of HTTP requests in seconds"),
		metric.WithUnit("s"),
	)
	if err != nil {
		return nil, err
	}

	requestCount, err := meter.Int64Counter(
		"http_requests_total",
		metric.WithDescription("Total number of HTTP requests"),
	)
	if err != nil {
		return nil, err
	}

	responseSize, err := meter.Int64Histogram(
		"http_response_size_bytes",
		metric.WithDescription("Size of HTTP responses in bytes"),
		metric.WithUnit("By"),
	)
	if err != nil {
		return nil, err
	}

	return &HTTPMetrics{
		requestDuration: requestDuration,
		requestCount:    requestCount,
		responseSize:    responseSize,
	}, nil
}

// GinMiddleware returns a Gin middleware that adds OpenTelemetry tracing
func GinMiddleware(serviceName string) gin.HandlerFunc {
	return otelgin.Middleware(serviceName)
}

// GinMetricsMiddleware returns a Gin middleware that records HTTP metrics
func GinMetricsMiddleware(metrics *HTTPMetrics) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Process request
		c.Next()

		// Record metrics
		duration := time.Since(start).Seconds()
		status := c.Writer.Status()
		method := c.Request.Method
		route := c.FullPath()
		if route == "" {
			route = "unknown"
		}

		// Common attributes
		attrs := []attribute.KeyValue{
			attribute.String("http.method", method),
			attribute.String("http.route", route),
			attribute.Int("http.status_code", status),
		}

		// Record request count
		metrics.requestCount.Add(c.Request.Context(), 1, metric.WithAttributes(attrs...))

		// Record request duration
		metrics.requestDuration.Record(c.Request.Context(), duration, metric.WithAttributes(attrs...))

		// Record response size if available
		if size := c.Writer.Size(); size > 0 {
			metrics.responseSize.Record(c.Request.Context(), int64(size), metric.WithAttributes(attrs...))
		}
	}
}

// AddCustomAttributes adds custom attributes to the current span
func AddCustomAttributes(c *gin.Context, attrs ...attribute.KeyValue) {
	span := trace.SpanFromContext(c.Request.Context())
	if span.IsRecording() {
		span.SetAttributes(attrs...)
	}
}

// AddCustomEvent adds a custom event to the current span
func AddCustomEvent(c *gin.Context, name string, attrs ...attribute.KeyValue) {
	span := trace.SpanFromContext(c.Request.Context())
	if span.IsRecording() {
		span.AddEvent(name, trace.WithAttributes(attrs...))
	}
}

// SetSpanStatus sets the status of the current span
func SetSpanStatus(c *gin.Context, code codes.Code, description string) {
	span := trace.SpanFromContext(c.Request.Context())
	if span.IsRecording() {
		span.SetStatus(code, description)
	}
}

// RecordErrorInSpan records an error in the current span
func RecordErrorInSpan(c *gin.Context, err error, attrs ...attribute.KeyValue) {
	span := trace.SpanFromContext(c.Request.Context())
	if span.IsRecording() {
		span.RecordError(err, trace.WithAttributes(attrs...))
		span.SetStatus(codes.Error, err.Error())
	}
}
