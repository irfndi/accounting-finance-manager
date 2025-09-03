# OpenTelemetry & SigNoz Deployment Configurations

## 1. Docker Compose Configuration

### 1.1 Main Observability Stack

```yaml
# docker-compose.observability.yml
version: "3.8"

services:
  # ClickHouse Database
  clickhouse:
    image: clickhouse/clickhouse-server:23.8-alpine
    container_name: signoz-clickhouse
    hostname: clickhouse
    ports:
      - "9000:9000"
      - "8123:8123"
      - "9009:9009"
    volumes:
      - clickhouse_data:/var/lib/clickhouse/
      - ./observability/clickhouse/clickhouse-config.xml:/etc/clickhouse-server/config.xml:ro
      - ./observability/clickhouse/users.xml:/etc/clickhouse-server/users.xml:ro
      - ./observability/clickhouse/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    environment:
      - CLICKHOUSE_DB=signoz_traces
      - CLICKHOUSE_USER=signoz
      - CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD:-signoz}
      - CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT=1
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "clickhouse-client", "--query", "SELECT 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - signoz-network

  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.88.0
    container_name: otel-collector
    hostname: otel-collector
    command: ["--config=/etc/otel-collector-config.yaml"]
    ports:
      - "4317:4317" # OTLP gRPC receiver
      - "4318:4318" # OTLP HTTP receiver
      - "8888:8888" # Prometheus metrics
      - "8889:8889" # Prometheus exporter
      - "13133:13133" # Health check
      - "1777:1777" # pprof extension
      - "55679:55679" # zpages extension
    volumes:
      - ./observability/otel/otel-collector-config.yaml:/etc/otel-collector-config.yaml:ro
    environment:
      - ENVIRONMENT=${ENVIRONMENT:-development}
      - CLICKHOUSE_ENDPOINT=clickhouse:9000
      - CLICKHOUSE_USERNAME=signoz
      - CLICKHOUSE_PASSWORD=${CLICKHOUSE_PASSWORD:-signoz}
    depends_on:
      clickhouse:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:13133"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - signoz-network

  # SigNoz Query Service
  query-service:
    image: signoz/query-service:0.34.0
    container_name: signoz-query-service
    hostname: query-service
    ports:
      - "8080:8080"
    environment:
      - ClickHouseUrl=tcp://clickhouse:9000
      - STORAGE=clickhouse
      - GODEBUG=netdns=go
      - TELEMETRY_ENABLED=true
      - DEPLOYMENT_TYPE=docker-standalone-amd
      - SIGNOZ_LOCAL_DB_PATH=/var/lib/signoz/signoz.db
    volumes:
      - signoz_data:/var/lib/signoz/
      - ./observability/signoz/prometheus.yml:/root/config/prometheus.yml:ro
    depends_on:
      clickhouse:
        condition: service_healthy
      otel-collector:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - signoz-network

  # SigNoz Frontend
  signoz-frontend:
    image: signoz/frontend:0.34.0
    container_name: signoz-frontend
    hostname: signoz-frontend
    ports:
      - "3301:3301"
    environment:
      - FRONTEND_API_ENDPOINT=http://query-service:8080
    depends_on:
      query-service:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3301"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - signoz-network

  # AlertManager
  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: signoz-alertmanager
    hostname: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./observability/alertmanager/config.yml:/etc/alertmanager/config.yml:ro
      - ./observability/alertmanager/templates:/etc/alertmanager/templates:ro
      - alertmanager_data:/alertmanager
    command:
      - "--config.file=/etc/alertmanager/config.yml"
      - "--storage.path=/alertmanager"
      - "--web.external-url=http://localhost:9093"
      - "--web.route-prefix=/"
      - "--cluster.listen-address="
      - "--log.level=info"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9093/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - signoz-network

  # Redis Exporter (for monitoring Redis)
  redis-exporter:
    image: oliver006/redis_exporter:v1.55.0
    container_name: redis-exporter
    hostname: redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://redis:6379
      - REDIS_PASSWORD=${REDIS_PASSWORD:-}
    command:
      - "--redis.addr=redis://redis:6379"
      - "--web.listen-address=0.0.0.0:9121"
      - "--web.telemetry-path=/metrics"
    restart: unless-stopped
    networks:
      - signoz-network
      - finance-manager-network

  # Postgres Exporter (for monitoring PostgreSQL)
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:v0.15.0
    container_name: postgres-exporter
    hostname: postgres-exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-finance_manager}?sslmode=disable
    restart: unless-stopped
    networks:
      - signoz-network
      - finance-manager-network

  # Nginx Exporter (for monitoring Nginx)
  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:0.11.0
    container_name: nginx-exporter
    hostname: nginx-exporter
    ports:
      - "9113:9113"
    command:
      - "-nginx.scrape-uri=http://nginx:8080/nginx_status"
    restart: unless-stopped
    networks:
      - signoz-network
      - finance-manager-network

volumes:
  clickhouse_data:
    driver: local
  signoz_data:
    driver: local
  alertmanager_data:
    driver: local

networks:
  signoz-network:
    driver: bridge
  finance-manager-network:
    external: true
```

### 1.2 Environment Variables

```bash
# .env.observability

# Environment Configuration
ENVIRONMENT=development
COMPOSE_PROJECT_NAME=finance-manager-observability

# ClickHouse Configuration
CLICKHOUSE_PASSWORD=signoz_secure_password_2024
CLICKHOUSE_USER=signoz
CLICKHOUSE_DB=signoz_traces
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=9000

# OpenTelemetry Configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_EXPORTER_OTLP_HEADERS=""
OTEL_RESOURCE_ATTRIBUTES="service.namespace=finance-manager,deployment.environment=development"
OTEL_SERVICE_NAME=finance-manager
OTEL_SERVICE_VERSION=1.0.0

# Tracing Configuration
TRACE_SAMPLING_RATE=0.1
TRACE_EXPORT_TIMEOUT=30s
TRACE_EXPORT_BATCH_SIZE=512
TRACE_EXPORT_MAX_BATCH_SIZE=2048

# Metrics Configuration
METRICS_EXPORT_INTERVAL=15s
METRICS_EXPORT_TIMEOUT=30s

# SigNoz Configuration
SIGNOZ_ENDPOINT=http://localhost:3301
SIGNOZ_API_KEY=""

# AlertManager Configuration
ALERT_MANAGER_URL=http://alertmanager:9093
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=alerts@finance-manager.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=alerts@finance-manager.com

# Slack Configuration (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#alerts

# Database Monitoring
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=finance_manager
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis Monitoring
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=""

# Data Retention
TRACES_RETENTION_DAYS=30
METRICS_RETENTION_DAYS=90
LOGS_RETENTION_DAYS=7

# Performance Tuning
CLICKHOUSE_MAX_MEMORY_USAGE=8000000000
CLICKHOUSE_MAX_CONCURRENT_QUERIES=100
OTEL_COLLECTOR_MEMORY_LIMIT=1024
OTEL_COLLECTOR_CPU_LIMIT=1000

# Security
ENABLE_TLS=false
TLS_CERT_PATH=/etc/ssl/certs/
TLS_KEY_PATH=/etc/ssl/private/

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=""
BACKUP_S3_REGION=""
BACKUP_S3_ACCESS_KEY=""
BACKUP_S3_SECRET_KEY=""
```

## 2. ClickHouse Configuration

### 2.1 Users Configuration

```xml
<!-- observability/clickhouse/users.xml -->
<?xml version="1.0"?>
<clickhouse>
    <users>
        <signoz>
            <password>signoz_secure_password_2024</password>
            <networks>
                <ip>::/0</ip>
            </networks>
            <profile>default</profile>
            <quota>default</quota>
            <access_management>1</access_management>
            <databases>
                <database>signoz_traces</database>
                <database>signoz_metrics</database>
                <database>signoz_logs</database>
            </databases>
        </signoz>

        <default>
            <password></password>
            <networks>
                <ip>::1</ip>
                <ip>127.0.0.1</ip>
            </networks>
            <profile>default</profile>
            <quota>default</quota>
        </default>
    </users>

    <profiles>
        <default>
            <max_memory_usage>8000000000</max_memory_usage>
            <use_uncompressed_cache>1</use_uncompressed_cache>
            <load_balancing>random</load_balancing>
            <max_execution_time>300</max_execution_time>
            <max_concurrent_queries_for_user>10</max_concurrent_queries_for_user>
            <max_bytes_before_external_group_by>2000000000</max_bytes_before_external_group_by>
            <max_bytes_before_external_sort>2000000000</max_bytes_before_external_sort>
            <group_by_two_level_threshold>100000</group_by_two_level_threshold>
            <group_by_two_level_threshold_bytes>50000000</group_by_two_level_threshold_bytes>
            <max_rows_to_read>1000000000</max_rows_to_read>
            <max_bytes_to_read>100000000000</max_bytes_to_read>
            <readonly>0</readonly>
        </default>

        <readonly>
            <readonly>1</readonly>
            <max_memory_usage>4000000000</max_memory_usage>
            <max_execution_time>60</max_execution_time>
            <max_concurrent_queries_for_user>5</max_concurrent_queries_for_user>
        </readonly>
    </profiles>

    <quotas>
        <default>
            <interval>
                <duration>3600</duration>
                <queries>1000</queries>
                <errors>100</errors>
                <result_rows>1000000000</result_rows>
                <read_rows>1000000000</read_rows>
                <execution_time>3600</execution_time>
            </interval>
        </default>
    </quotas>
</clickhouse>
```

### 2.2 Database Initialization

```sql
-- observability/clickhouse/init-db.sql

-- Create databases
CREATE DATABASE IF NOT EXISTS signoz_traces;
CREATE DATABASE IF NOT EXISTS signoz_metrics;
CREATE DATABASE IF NOT EXISTS signoz_logs;

-- Use traces database
USE signoz_traces;

-- Create traces table
CREATE TABLE IF NOT EXISTS signoz_index_v2 (
    timestamp DateTime64(9) CODEC(DoubleDelta, LZ4),
    traceID FixedString(32) CODEC(ZSTD(1)),
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
    INDEX idx_service serviceName TYPE bloom_filter GRANULARITY 4,
    INDEX idx_name name TYPE bloom_filter GRANULARITY 4,
    INDEX idx_kind kind TYPE set(10) GRANULARITY 4,
    INDEX idx_duration durationNano TYPE minmax GRANULARITY 1,
    INDEX idx_hasError hasError TYPE set(2) GRANULARITY 1,
    INDEX idx_httpCode httpCode TYPE set(100) GRANULARITY 4,
    INDEX idx_httpMethod httpMethod TYPE set(10) GRANULARITY 4,
    INDEX idx_httpRoute httpRoute TYPE bloom_filter GRANULARITY 4
) ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (serviceName, hasError, toStartOfHour(timestamp), timestamp)
TTL toDateTime(timestamp) + toIntervalDay(30)
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1;

-- Create spans table
CREATE TABLE IF NOT EXISTS signoz_spans (
    timestamp DateTime64(9) CODEC(DoubleDelta, LZ4),
    traceID FixedString(32) CODEC(ZSTD(1)),
    model String CODEC(ZSTD(1))
) ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (traceID, timestamp)
TTL toDateTime(timestamp) + toIntervalDay(30)
SETTINGS index_granularity = 1024, ttl_only_drop_parts = 1;

-- Use metrics database
USE signoz_metrics;

-- Create metrics table
CREATE TABLE IF NOT EXISTS samples (
    metric_name LowCardinality(String) CODEC(ZSTD(1)),
    fingerprint UInt64 CODEC(ZSTD(1)),
    timestamp_ms Int64 CODEC(DoubleDelta, LZ4),
    value Float64 CODEC(ZSTD(1)),
    INDEX idx_metric_name metric_name TYPE bloom_filter GRANULARITY 4,
    INDEX idx_timestamp timestamp_ms TYPE minmax GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toDate(timestamp_ms / 1000)
ORDER BY (metric_name, fingerprint, timestamp_ms)
TTL toDateTime(timestamp_ms / 1000) + toIntervalDay(90)
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1;

-- Create time series table
CREATE TABLE IF NOT EXISTS time_series (
    metric_name LowCardinality(String) CODEC(ZSTD(1)),
    fingerprint UInt64 CODEC(ZSTD(1)),
    labels String CODEC(ZSTD(1)),
    INDEX idx_metric_name metric_name TYPE bloom_filter GRANULARITY 4
) ENGINE = ReplacingMergeTree()
ORDER BY (metric_name, fingerprint)
SETTINGS index_granularity = 8192;

-- Use logs database
USE signoz_logs;

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
    timestamp DateTime64(9) CODEC(DoubleDelta, LZ4),
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
    INDEX idx_trace_id trace_id TYPE bloom_filter GRANULARITY 4,
    INDEX idx_severity severity_number TYPE set(10) GRANULARITY 4,
    INDEX idx_body body TYPE tokenbf_v1(10240, 3, 0) GRANULARITY 4
) ENGINE = MergeTree()
PARTITION BY toDate(timestamp)
ORDER BY (timestamp, id)
TTL toDateTime(timestamp) + toIntervalDay(7)
SETTINGS index_granularity = 8192, ttl_only_drop_parts = 1;

-- Grant permissions
GRANT ALL ON signoz_traces.* TO signoz;
GRANT ALL ON signoz_metrics.* TO signoz;
GRANT ALL ON signoz_logs.* TO signoz;
```

## 3. AlertManager Configuration

### 3.1 Main Configuration

```yaml
# observability/alertmanager/config.yml
global:
  smtp_smarthost: "${SMTP_HOST}:${SMTP_PORT}"
  smtp_from: "${SMTP_FROM}"
  smtp_auth_username: "${SMTP_USERNAME}"
  smtp_auth_password: "${SMTP_PASSWORD}"
  smtp_require_tls: true

route:
  group_by: ["alertname", "cluster", "service"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: "default"
  routes:
    - match:
        severity: critical
      receiver: "critical-alerts"
      group_wait: 5s
      repeat_interval: 30m

    - match:
        severity: warning
      receiver: "warning-alerts"
      group_wait: 30s
      repeat_interval: 2h

    - match:
        alertname: "HighErrorRate"
      receiver: "error-alerts"
      group_wait: 5s
      repeat_interval: 15m

    - match:
        alertname: "HighLatency"
      receiver: "performance-alerts"
      group_wait: 10s
      repeat_interval: 30m

receivers:
  - name: "default"
    email_configs:
      - to: "team@finance-manager.com"
        subject: "[Finance Manager] {{ .GroupLabels.alertname }}"
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Labels: {{ range .Labels.SortedPairs }}{{ .Name }}={{ .Value }} {{ end }}
          {{ end }}

  - name: "critical-alerts"
    email_configs:
      - to: "oncall@finance-manager.com"
        subject: "🚨 CRITICAL: {{ .GroupLabels.alertname }}"
        body: |
          CRITICAL ALERT TRIGGERED

          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Severity: {{ .Labels.severity }}
          Service: {{ .Labels.service_name }}
          Time: {{ .StartsAt }}

          Labels: {{ range .Labels.SortedPairs }}{{ .Name }}={{ .Value }} {{ end }}
          {{ end }}

          Please investigate immediately!
    slack_configs:
      - api_url: "${SLACK_WEBHOOK_URL}"
        channel: "${SLACK_CHANNEL}"
        title: "🚨 Critical Alert: {{ .GroupLabels.alertname }}"
        text: |
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Description:* {{ .Annotations.description }}
          *Service:* {{ .Labels.service_name }}
          *Severity:* {{ .Labels.severity }}
          {{ end }}
        color: "danger"

  - name: "warning-alerts"
    email_configs:
      - to: "team@finance-manager.com"
        subject: "⚠️ WARNING: {{ .GroupLabels.alertname }}"
        body: |
          WARNING ALERT

          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Service: {{ .Labels.service_name }}
          {{ end }}
    slack_configs:
      - api_url: "${SLACK_WEBHOOK_URL}"
        channel: "${SLACK_CHANNEL}"
        title: "⚠️ Warning: {{ .GroupLabels.alertname }}"
        text: |
          {{ range .Alerts }}
          *Alert:* {{ .Annotations.summary }}
          *Service:* {{ .Labels.service_name }}
          {{ end }}
        color: "warning"

  - name: "error-alerts"
    email_configs:
      - to: "dev-team@finance-manager.com"
        subject: "🔥 High Error Rate: {{ .GroupLabels.alertname }}"
        body: |
          HIGH ERROR RATE DETECTED

          {{ range .Alerts }}
          Service: {{ .Labels.service_name }}
          Error Rate: {{ .Annotations.error_rate }}
          Description: {{ .Annotations.description }}
          {{ end }}

  - name: "performance-alerts"
    email_configs:
      - to: "performance-team@finance-manager.com"
        subject: "🐌 Performance Issue: {{ .GroupLabels.alertname }}"
        body: |
          PERFORMANCE DEGRADATION DETECTED

          {{ range .Alerts }}
          Service: {{ .Labels.service_name }}
          Latency: {{ .Annotations.latency }}
          Description: {{ .Annotations.description }}
          {{ end }}

inhibit_rules:
  - source_match:
      severity: "critical"
    target_match:
      severity: "warning"
    equal: ["alertname", "service_name"]

  - source_match:
      alertname: "ServiceDown"
    target_match_re:
      alertname: "(HighLatency|HighErrorRate)"
    equal: ["service_name"]

templates:
  - "/etc/alertmanager/templates/*.tmpl"
```

### 3.2 Alert Rules

```yaml
# observability/alertmanager/rules.yml
groups:
  - name: finance-manager-backend
    rules:
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{job="finance-manager-backend",code=~"5.."}[5m])) /
            sum(rate(http_requests_total{job="finance-manager-backend"}[5m]))
          ) > 0.05
        for: 2m
        labels:
          severity: critical
          service_name: finance-manager-backend
        annotations:
          summary: "High error rate detected in backend service"
          description: "Error rate is {{ $value | humanizePercentage }} for the last 5 minutes"
          error_rate: "{{ $value | humanizePercentage }}"
          runbook_url: "https://docs.finance-manager.com/runbooks/high-error-rate"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="finance-manager-backend"}[5m])) by (le)) > 0.5
        for: 5m
        labels:
          severity: warning
          service_name: finance-manager-backend
        annotations:
          summary: "High latency detected in backend service"
          description: "95th percentile latency is {{ $value }}s for the last 5 minutes"
          latency: "{{ $value }}s"
          runbook_url: "https://docs.finance-manager.com/runbooks/high-latency"

      - alert: ServiceDown
        expr: up{job="finance-manager-backend"} == 0
        for: 1m
        labels:
          severity: critical
          service_name: finance-manager-backend
        annotations:
          summary: "Backend service is down"
          description: "Finance Manager backend service has been down for more than 1 minute"
          runbook_url: "https://docs.finance-manager.com/runbooks/service-down"

      - alert: HighMemoryUsage
        expr: |
          (process_resident_memory_bytes{job="finance-manager-backend"} / 1024 / 1024) > 1024
        for: 10m
        labels:
          severity: warning
          service_name: finance-manager-backend
        annotations:
          summary: "High memory usage in backend service"
          description: "Memory usage is {{ $value }}MB for the last 10 minutes"
          memory_usage: "{{ $value }}MB"

      - alert: HighCPUUsage
        expr: |
          rate(process_cpu_seconds_total{job="finance-manager-backend"}[5m]) * 100 > 80
        for: 10m
        labels:
          severity: warning
          service_name: finance-manager-backend
        annotations:
          summary: "High CPU usage in backend service"
          description: "CPU usage is {{ $value }}% for the last 10 minutes"
          cpu_usage: "{{ $value }}%"

  - name: finance-manager-database
    rules:
      - alert: DatabaseConnectionsHigh
        expr: |
          pg_stat_database_numbackends{datname="finance_manager"} > 80
        for: 5m
        labels:
          severity: warning
          service_name: postgresql
        annotations:
          summary: "High number of database connections"
          description: "Database has {{ $value }} active connections"
          connections: "{{ $value }}"

      - alert: DatabaseSlowQueries
        expr: |
          pg_stat_activity_max_tx_duration{datname="finance_manager"} > 300
        for: 2m
        labels:
          severity: warning
          service_name: postgresql
        annotations:
          summary: "Slow database queries detected"
          description: "Longest running query is {{ $value }}s"
          query_duration: "{{ $value }}s"

      - alert: DatabaseDown
        expr: pg_up == 0
        for: 1m
        labels:
          severity: critical
          service_name: postgresql
        annotations:
          summary: "PostgreSQL database is down"
          description: "PostgreSQL database has been down for more than 1 minute"

  - name: finance-manager-redis
    rules:
      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        labels:
          severity: critical
          service_name: redis
        annotations:
          summary: "Redis is down"
          description: "Redis has been down for more than 1 minute"

      - alert: RedisHighMemoryUsage
        expr: |
          (redis_memory_used_bytes / redis_memory_max_bytes) * 100 > 90
        for: 5m
        labels:
          severity: warning
          service_name: redis
        annotations:
          summary: "Redis high memory usage"
          description: "Redis memory usage is {{ $value }}%"
          memory_usage: "{{ $value }}%"

      - alert: RedisHighConnections
        expr: redis_connected_clients > 100
        for: 5m
        labels:
          severity: warning
          service_name: redis
        annotations:
          summary: "Redis high number of connections"
          description: "Redis has {{ $value }} connected clients"
          connections: "{{ $value }}"

  - name: finance-manager-infrastructure
    rules:
      - alert: ClickHouseDown
        expr: up{job="clickhouse"} == 0
        for: 1m
        labels:
          severity: critical
          service_name: clickhouse
        annotations:
          summary: "ClickHouse is down"
          description: "ClickHouse has been down for more than 1 minute"

      - alert: OtelCollectorDown
        expr: up{job="otel-collector"} == 0
        for: 1m
        labels:
          severity: critical
          service_name: otel-collector
        annotations:
          summary: "OpenTelemetry Collector is down"
          description: "OpenTelemetry Collector has been down for more than 1 minute"

      - alert: SigNozDown
        expr: up{job="signoz-query-service"} == 0
        for: 1m
        labels:
          severity: critical
          service_name: signoz
        annotations:
          summary: "SigNoz is down"
          description: "SigNoz query service has been down for more than 1 minute"

      - alert: DiskSpaceHigh
        expr: |
          (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 10
        for: 5m
        labels:
          severity: critical
          service_name: system
        annotations:
          summary: "Low disk space"
          description: "Disk space is {{ $value }}% full"
          disk_usage: "{{ $value }}%"
```

## 4. Nginx Configuration with OpenTelemetry

```nginx
# observability/nginx/nginx-otel.conf

# Load OpenTelemetry module
load_module modules/ngx_otel_module.so;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # OpenTelemetry configuration
    otel_exporter {
        endpoint http://otel-collector:4317;
        interval 5s;
        batch_size 512;
        batch_count 4;
    }

    otel_service_name "finance-manager-nginx";
    otel_trace on;

    # Custom log format with trace information
    log_format otel_trace '$remote_addr - $remote_user [$time_local] '
                         '"$request" $status $body_bytes_sent '
                         '"$http_referer" "$http_user_agent" '
                         'trace_id="$otel_trace_id" span_id="$otel_span_id"';

    # Enable status page for monitoring
    server {
        listen 8080;
        server_name localhost;

        location /nginx_status {
            stub_status on;
            access_log off;
            allow 127.0.0.1;
            allow 172.16.0.0/12;  # Docker networks
            deny all;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # Main application server
    upstream backend {
        server backend:8080;
        keepalive 32;
    }

    upstream frontend {
        server frontend:3000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name localhost;

        access_log /var/log/nginx/access.log otel_trace;
        error_log /var/log/nginx/error.log;

        # Enable tracing for all locations
        otel_trace_context propagate;

        # Frontend routes
        location / {
            otel_operation_name "frontend_request";
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Add trace headers
            proxy_set_header X-Trace-Id $otel_trace_id;
            proxy_set_header X-Span-Id $otel_span_id;
        }

        # API routes
        location /api/ {
            otel_operation_name "api_request";
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Add trace headers
            proxy_set_header X-Trace-Id $otel_trace_id;
            proxy_set_header X-Span-Id $otel_span_id;

            # CORS headers
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Trace-Id,X-Span-Id";

            if ($request_method = 'OPTIONS') {
                add_header Access-Control-Max-Age 1728000;
                add_header Content-Type 'text/plain; charset=utf-8';
                add_header Content-Length 0;
                return 204;
            }
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Metrics endpoint for Prometheus
        location /metrics {
            access_log off;
            allow 127.0.0.1;
            allow 172.16.0.0/12;  # Docker networks
            deny all;

            proxy_pass http://nginx-exporter:9113/metrics;
        }
    }
}
```

## 5. Deployment Scripts

### 5.1 Quick Start Script

```bash
#!/bin/bash
# observability/scripts/quick-start.sh

set -e

echo "🚀 Finance Manager Observability Quick Start"
echo "==========================================="

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required"; exit 1; }

# Create directories
echo "📁 Creating directories..."
mkdir -p observability/{otel,clickhouse,signoz,alertmanager,nginx,dashboards,scripts}
mkdir -p data/{clickhouse,signoz,alertmanager}
mkdir -p logs

# Copy configuration files
echo "⚙️ Setting up configuration files..."
cp docker-compose.observability.yml ./
cp .env.observability ./

# Set permissions
chmod +x observability/scripts/*.sh

# Load environment variables
if [ -f ".env.observability" ]; then
    export $(cat .env.observability | grep -v '^#' | xargs)
fi

# Start the stack
echo "🏗️ Starting observability stack..."
docker-compose -f docker-compose.observability.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run health checks
echo "🏥 Running health checks..."
./observability/scripts/health-check.sh

# Run tests
echo "🧪 Running tests..."
./observability/scripts/test-observability.sh

echo ""
echo "🎉 Observability stack is ready!"
echo ""
echo "📊 SigNoz UI: http://localhost:3301"
echo "🚨 AlertManager: http://localhost:9093"
echo "🔍 OpenTelemetry Collector: http://localhost:13133"
echo "🗄️ ClickHouse: http://localhost:8123"
echo ""
echo "📝 Next steps:"
echo "1. Configure your applications to send telemetry data"
echo "2. Import dashboards from observability/dashboards/"
echo "3. Set up notification channels in AlertManager"
echo "4. Review and customize alert rules"
```

### 5.2 Cleanup Script

```bash
#!/bin/bash
# observability/scripts/cleanup.sh

set -e

echo "🧹 Cleaning up observability stack"
echo "================================="

read -p "Are you sure you want to remove all observability data? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled"
    exit 1
fi

# Stop and remove containers
echo "🛑 Stopping containers..."
docker-compose -f docker-compose.observability.yml down

# Remove volumes
echo "🗑️ Removing volumes..."
docker volume rm finance-manager-observability_clickhouse_data || true
docker volume rm finance-manager-observability_signoz_data || true
docker volume rm finance-manager-observability_alertmanager_data || true

# Remove networks
echo "🌐 Removing networks..."
docker network rm finance-manager-observability_signoz-network || true

# Remove images (optional)
read -p "Do you want to remove Docker images as well? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🖼️ Removing images..."
    docker rmi clickhouse/clickhouse-server:23.8-alpine || true
    docker rmi otel/opentelemetry-collector-contrib:0.88.0 || true
    docker rmi signoz/query-service:0.34.0 || true
    docker rmi signoz/frontend:0.34.0 || true
    docker rmi prom/alertmanager:v0.26.0 || true
    docker rmi oliver006/redis_exporter:v1.55.0 || true
    docker rmi prometheuscommunity/postgres-exporter:v0.15.0 || true
    docker rmi nginx/nginx-prometheus-exporter:0.11.0 || true
fi

echo "✅ Cleanup completed"
```

This comprehensive deployment configuration provides everything needed to set up the OpenTelemetry and SigNoz observability stack for the Finance Manager application. The configuration includes proper security
