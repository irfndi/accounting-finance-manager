-- Create SigNoz databases
CREATE DATABASE IF NOT EXISTS signoz_traces;
CREATE DATABASE IF NOT EXISTS signoz_metrics;
CREATE DATABASE IF NOT EXISTS signoz_logs;

-- Use the traces database
USE signoz_traces;

-- Create traces table
CREATE TABLE IF NOT EXISTS signoz_index_v2 (
    timestamp DateTime64(9) CODEC(DoubleDelta, LZ4),
    traceID String CODEC(ZSTD(1)),
    spanID String CODEC(ZSTD(1)),
    parentSpanID String CODEC(ZSTD(1)),
    serviceName LowCardinality(String) CODEC(ZSTD(1)),
    name LowCardinality(String) CODEC(ZSTD(1)),
    kind Int8 CODEC(ZSTD(1)),
    durationNano UInt64 CODEC(ZSTD(1)),
    statusCode Int16 CODEC(ZSTD(1)),
    component LowCardinality(String) CODEC(ZSTD(1)),
    httpMethod LowCardinality(String) CODEC(ZSTD(1)),
    httpUrl String CODEC(ZSTD(1)),
    httpCode LowCardinality(String) CODEC(ZSTD(1)),
    httpRoute LowCardinality(String) CODEC(ZSTD(1)),
    httpHost LowCardinality(String) CODEC(ZSTD(1)),
    msgSystem LowCardinality(String) CODEC(ZSTD(1)),
    msgOperation LowCardinality(String) CODEC(ZSTD(1)),
    hasError Bool CODEC(ZSTD(1)),
    tagMap Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    rpcSystem LowCardinality(String) CODEC(ZSTD(1)),
    rpcService LowCardinality(String) CODEC(ZSTD(1)),
    rpcMethod LowCardinality(String) CODEC(ZSTD(1)),
    responseStatusCode LowCardinality(String) CODEC(ZSTD(1)),
    stringTagMap Map(String, String) CODEC(ZSTD(1)),
    numberTagMap Map(String, Float64) CODEC(ZSTD(1)),
    boolTagMap Map(String, Bool) CODEC(ZSTD(1)),
    resourceTagsMap Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    isRemote LowCardinality(String) CODEC(ZSTD(1)),
    statusMessage String CODEC(ZSTD(1)),
    spanKind LowCardinality(String) CODEC(ZSTD(1)),
    references String CODEC(ZSTD(1)),
    gRPCMethod LowCardinality(String) CODEC(ZSTD(1)),
    gRPCCode LowCardinality(String) CODEC(ZSTD(1)),
    INDEX idx_service serviceName TYPE bloom_filter GRANULARITY 4,
    INDEX idx_name name TYPE bloom_filter GRANULARITY 4,
    INDEX idx_kind kind TYPE minmax GRANULARITY 4,
    INDEX idx_duration durationNano TYPE minmax GRANULARITY 1,
    INDEX idx_hasError hasError TYPE set(2) GRANULARITY 1,
    INDEX idx_httpCode httpCode TYPE set(0) GRANULARITY 1,
    INDEX idx_httpMethod httpMethod TYPE set(0) GRANULARITY 1,
    INDEX idx_httpRoute httpRoute TYPE bloom_filter GRANULARITY 4,
    INDEX idx_httpUrl httpUrl TYPE bloom_filter GRANULARITY 4,
    INDEX idx_httpHost httpHost TYPE bloom_filter GRANULARITY 4,
    INDEX idx_msgSystem msgSystem TYPE set(0) GRANULARITY 1,
    INDEX idx_msgOperation msgOperation TYPE set(0) GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (serviceName, hasError, toStartOfHour(timestamp), timestamp)
TTL toDateTime(timestamp) + toIntervalDay(7)
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1;

-- Create spans table for detailed span data
CREATE TABLE IF NOT EXISTS signoz_spans (
    timestamp DateTime64(9) CODEC(DoubleDelta, LZ4),
    traceID String CODEC(ZSTD(1)),
    model String CODEC(ZSTD(1))
) ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (traceID, timestamp)
TTL toDateTime(timestamp) + toIntervalDay(7)
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1;

-- Create dependency graph table
CREATE TABLE IF NOT EXISTS dependency_graph_minutes (
    src LowCardinality(String),
    dest LowCardinality(String),
    operation LowCardinality(String),
    duration_quantile_50 Float64,
    duration_quantile_95 Float64,
    duration_quantile_99 Float64,
    request_rate Float64,
    error_rate Float64,
    num_calls UInt64,
    timestamp DateTime CODEC(DoubleDelta, LZ4)
) ENGINE = SummingMergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (src, dest, operation, timestamp)
TTL toDateTime(timestamp) + toIntervalDay(7)
SETTINGS index_granularity = 8192;

-- Switch to metrics database
USE signoz_metrics;

-- Create metrics table
CREATE TABLE IF NOT EXISTS signoz_metrics (
    metric_name LowCardinality(String) CODEC(ZSTD(1)),
    timestamp_ms Int64 CODEC(DoubleDelta, LZ4),
    value Float64 CODEC(ZSTD(1)),
    fingerprint UInt64 CODEC(ZSTD(1)),
    labels String CODEC(ZSTD(1))
) ENGINE = MergeTree()
PARTITION BY toStartOfDay(toDateTime(timestamp_ms / 1000))
ORDER BY (metric_name, fingerprint, timestamp_ms)
TTL toDateTime(timestamp_ms / 1000) + toIntervalDay(7)
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1;

-- Create time series table
CREATE TABLE IF NOT EXISTS time_series_v2 (
    metric_name LowCardinality(String) CODEC(ZSTD(1)),
    fingerprint UInt64 CODEC(ZSTD(1)),
    timestamp_ms Int64 CODEC(DoubleDelta, LZ4),
    value Float64 CODEC(ZSTD(1)),
    labels String CODEC(ZSTD(1))
) ENGINE = MergeTree()
PARTITION BY toStartOfDay(toDateTime(timestamp_ms / 1000))
ORDER BY (metric_name, fingerprint, timestamp_ms)
TTL toDateTime(timestamp_ms / 1000) + toIntervalDay(7)
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1;

-- Switch to logs database
USE signoz_logs;

-- Create logs table
CREATE TABLE IF NOT EXISTS signoz_logs (
    timestamp DateTime64(9) CODEC(DoubleDelta, LZ4),
    observed_timestamp DateTime64(9) CODEC(DoubleDelta, LZ4),
    id String CODEC(ZSTD(1)),
    trace_id String CODEC(ZSTD(1)),
    span_id String CODEC(ZSTD(1)),
    trace_flags UInt32 CODEC(ZSTD(1)),
    severity_text LowCardinality(String) CODEC(ZSTD(1)),
    severity_number UInt8 CODEC(ZSTD(1)),
    body String CODEC(ZSTD(1)),
    resources_string_key Array(String) CODEC(ZSTD(1)),
    resources_string_value Array(String) CODEC(ZSTD(1)),
    attributes_string_key Array(String) CODEC(ZSTD(1)),
    attributes_string_value Array(String) CODEC(ZSTD(1)),
    attributes_number_key Array(String) CODEC(ZSTD(1)),
    attributes_number_value Array(Float64) CODEC(ZSTD(1)),
    attributes_bool_key Array(String) CODEC(ZSTD(1)),
    attributes_bool_value Array(Bool) CODEC(ZSTD(1)),
    INDEX idx_trace_id trace_id TYPE bloom_filter GRANULARITY 1,
    INDEX idx_span_id span_id TYPE bloom_filter GRANULARITY 1,
    INDEX idx_severity severity_number TYPE set(25) GRANULARITY 1,
    INDEX idx_body body TYPE tokenbf_v1(10240, 3, 0) GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (timestamp, id)
TTL toDateTime(timestamp) + toIntervalDay(7)
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1;

-- Create distributed logs table for better performance
CREATE TABLE IF NOT EXISTS distributed_signoz_logs (
    timestamp DateTime64(9),
    observed_timestamp DateTime64(9),
    id String,
    trace_id String,
    span_id String,
    trace_flags UInt32,
    severity_text LowCardinality(String),
    severity_number UInt8,
    body String,
    resources_string_key Array(String),
    resources_string_value Array(String),
    attributes_string_key Array(String),
    attributes_string_value Array(String),
    attributes_number_key Array(String),
    attributes_number_value Array(Float64),
    attributes_bool_key Array(String),
    attributes_bool_value Array(Bool)
) ENGINE = Distributed('logs_cluster', 'signoz_logs', 'signoz_logs', rand());

-- Grant permissions to signoz user
GRANT ALL PRIVILEGES ON signoz_traces.* TO signoz;
GRANT ALL PRIVILEGES ON signoz_metrics.* TO signoz;
GRANT ALL PRIVILEGES ON signoz_logs.* TO signoz;

-- Create materialized views for better query performance
USE signoz_traces;

CREATE MATERIALIZED VIEW IF NOT EXISTS service_map_mv
TO dependency_graph_minutes
AS SELECT
    serviceName as src,
    '' as dest,
    name as operation,
    quantile(0.5)(durationNano) as duration_quantile_50,
    quantile(0.95)(durationNano) as duration_quantile_95,
    quantile(0.99)(durationNano) as duration_quantile_99,
    count() / 60 as request_rate,
    countIf(hasError = true) / count() as error_rate,
    count() as num_calls,
    toStartOfMinute(timestamp) as timestamp
FROM signoz_index_v2
WHERE timestamp >= now() - INTERVAL 1 HOUR
GROUP BY src, dest, operation, timestamp;

-- Create indexes for better performance
USE signoz_traces;
ALTER TABLE signoz_index_v2 ADD INDEX IF NOT EXISTS idx_timestamp timestamp TYPE minmax GRANULARITY 1;
ALTER TABLE signoz_index_v2 ADD INDEX IF NOT EXISTS idx_traceID traceID TYPE bloom_filter GRANULARITY 1;

USE signoz_metrics;
ALTER TABLE signoz_metrics ADD INDEX IF NOT EXISTS idx_timestamp timestamp_ms TYPE minmax GRANULARITY 1;
ALTER TABLE time_series_v2 ADD INDEX IF NOT EXISTS idx_timestamp timestamp_ms TYPE minmax GRANULARITY 1;

USE signoz_logs;
ALTER TABLE signoz_logs ADD INDEX IF NOT EXISTS idx_timestamp timestamp TYPE minmax GRANULARITY 1;