package telemetry

import (
	"context"
	"log/slog"
	"os"

	"go.opentelemetry.io/otel/trace"
)

// LogLevel represents the logging level
type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
)

// Logger wraps slog.Logger with OpenTelemetry integration
type Logger struct {
	*slog.Logger
}

// NewLogger creates a new logger with OpenTelemetry integration
func NewLogger(level LogLevel, format string) *Logger {
	var slogLevel slog.Level
	switch level {
	case LogLevelDebug:
		slogLevel = slog.LevelDebug
	case LogLevelInfo:
		slogLevel = slog.LevelInfo
	case LogLevelWarn:
		slogLevel = slog.LevelWarn
	case LogLevelError:
		slogLevel = slog.LevelError
	default:
		slogLevel = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level:     slogLevel,
		AddSource: true,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			// Customize attribute formatting if needed
			return a
		},
	}

	var handler slog.Handler
	switch format {
	case "json":
		handler = slog.NewJSONHandler(os.Stdout, opts)
	default:
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	return &Logger{
		Logger: slog.New(handler),
	}
}

// WithTraceContext adds trace context to the logger
func (l *Logger) WithTraceContext(ctx context.Context) *Logger {
	span := trace.SpanFromContext(ctx)
	if !span.IsRecording() {
		return l
	}

	spanContext := span.SpanContext()
	logger := l.Logger.With(
		slog.String("trace_id", spanContext.TraceID().String()),
		slog.String("span_id", spanContext.SpanID().String()),
	)

	return &Logger{Logger: logger}
}

// WithFields adds structured fields to the logger
func (l *Logger) WithFields(fields map[string]interface{}) *Logger {
	args := make([]interface{}, 0, len(fields)*2)
	for k, v := range fields {
		args = append(args, k, v)
	}
	return &Logger{Logger: l.Logger.With(args...)}
}

// WithField adds a single field to the logger
func (l *Logger) WithField(key string, value interface{}) *Logger {
	return &Logger{Logger: l.Logger.With(key, value)}
}

// Debug logs a debug message with trace context
func (l *Logger) Debug(ctx context.Context, msg string, args ...interface{}) {
	l.WithTraceContext(ctx).Logger.Debug(msg, args...)
}

// Info logs an info message with trace context
func (l *Logger) Info(ctx context.Context, msg string, args ...interface{}) {
	l.WithTraceContext(ctx).Logger.Info(msg, args...)
}

// Warn logs a warning message with trace context
func (l *Logger) Warn(ctx context.Context, msg string, args ...interface{}) {
	l.WithTraceContext(ctx).Logger.Warn(msg, args...)
}

// Error logs an error message with trace context
func (l *Logger) Error(ctx context.Context, msg string, args ...interface{}) {
	l.WithTraceContext(ctx).Logger.Error(msg, args...)
}

// DebugWithFields logs a debug message with additional fields
func (l *Logger) DebugWithFields(ctx context.Context, msg string, fields map[string]interface{}) {
	l.WithTraceContext(ctx).WithFields(fields).Logger.Debug(msg)
}

// InfoWithFields logs an info message with additional fields
func (l *Logger) InfoWithFields(ctx context.Context, msg string, fields map[string]interface{}) {
	l.WithTraceContext(ctx).WithFields(fields).Logger.Info(msg)
}

// WarnWithFields logs a warning message with additional fields
func (l *Logger) WarnWithFields(ctx context.Context, msg string, fields map[string]interface{}) {
	l.WithTraceContext(ctx).WithFields(fields).Logger.Warn(msg)
}

// ErrorWithFields logs an error message with additional fields
func (l *Logger) ErrorWithFields(ctx context.Context, msg string, fields map[string]interface{}) {
	l.WithTraceContext(ctx).WithFields(fields).Logger.Error(msg)
}

// LogError logs an error with trace context and records it in the span
func (l *Logger) LogError(ctx context.Context, err error, msg string, fields ...map[string]interface{}) {
	span := trace.SpanFromContext(ctx)
	if span.IsRecording() {
		span.RecordError(err)
	}

	logger := l.WithTraceContext(ctx).WithField("error", err.Error())
	if len(fields) > 0 {
		logger = logger.WithFields(fields[0])
	}
	logger.Logger.Error(msg)
}

// LoadLoggerConfigFromEnv loads logger configuration from environment variables
func LoadLoggerConfigFromEnv() (LogLevel, string) {
	level := LogLevel(getEnvOrDefault("LOG_LEVEL", "info"))
	format := getEnvOrDefault("LOG_FORMAT", "text")
	return level, format
}

// Global logger instance
var globalLogger *Logger

// InitGlobalLogger initializes the global logger
func InitGlobalLogger(level LogLevel, format string) {
	globalLogger = NewLogger(level, format)
}

// GetGlobalLogger returns the global logger instance
func GetGlobalLogger() *Logger {
	if globalLogger == nil {
		// Initialize with default settings if not already initialized
		globalLogger = NewLogger(LogLevelInfo, "text")
	}
	return globalLogger
}

// Convenience functions using the global logger

// Debug logs a debug message using the global logger
func Debug(ctx context.Context, msg string, args ...interface{}) {
	GetGlobalLogger().Debug(ctx, msg, args...)
}

// Info logs an info message using the global logger
func Info(ctx context.Context, msg string, args ...interface{}) {
	GetGlobalLogger().Info(ctx, msg, args...)
}

// Warn logs a warning message using the global logger
func Warn(ctx context.Context, msg string, args ...interface{}) {
	GetGlobalLogger().Warn(ctx, msg, args...)
}

// Error logs an error message using the global logger
func Error(ctx context.Context, msg string, args ...interface{}) {
	GetGlobalLogger().Error(ctx, msg, args...)
}

// LogError logs an error using the global logger
func LogError(ctx context.Context, err error, msg string, fields ...map[string]interface{}) {
	GetGlobalLogger().LogError(ctx, err, msg, fields...)
}
