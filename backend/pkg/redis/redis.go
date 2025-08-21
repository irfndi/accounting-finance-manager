package redis

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"

	"finance-manager/pkg/telemetry"
)

type Client struct {
	*redis.Client
}

type Config struct {
	Host     string
	Port     int
	Password string
	DB       int
}

// NewConnection creates a new Redis connection
func NewConnection(cfg Config) (*Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:            fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password:        cfg.Password,
		DB:              cfg.DB,
		PoolSize:        10,
		MinIdleConns:    5,
		ConnMaxIdleTime: 5 * time.Minute,
	})

	// Initialize Redis metrics
	redisMetrics, err := telemetry.NewDatabaseMetrics()
	if err != nil {
		log.Printf("Warning: Failed to initialize Redis metrics: %v", err)
	} else {
		// Instrument Redis with custom metrics
		telemetry.InstrumentRedis(rdb, redisMetrics)
		log.Println("Redis OpenTelemetry instrumentation enabled")
	}

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping Redis: %w", err)
	}

	log.Println("Redis connection established successfully")
	return &Client{rdb}, nil
}

// Close closes the Redis connection
func (c *Client) Close() error {
	return c.Client.Close()
}

// Health checks if Redis is healthy
func (c *Client) Health(ctx context.Context) error {
	return c.Ping(ctx).Err()
}

// SetSession stores a session in Redis
func (c *Client) SetSession(ctx context.Context, sessionID string, userID string, expiration time.Duration) error {
	return c.Set(ctx, fmt.Sprintf("session:%s", sessionID), userID, expiration).Err()
}

// GetSession retrieves a session from Redis
func (c *Client) GetSession(ctx context.Context, sessionID string) (string, error) {
	return c.Get(ctx, fmt.Sprintf("session:%s", sessionID)).Result()
}

// DeleteSession removes a session from Redis
func (c *Client) DeleteSession(ctx context.Context, sessionID string) error {
	return c.Del(ctx, fmt.Sprintf("session:%s", sessionID)).Err()
}

// SetCache stores a value in Redis cache
func (c *Client) SetCache(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return c.Set(ctx, key, value, expiration).Err()
}

// GetCache retrieves a value from Redis cache
func (c *Client) GetCache(ctx context.Context, key string) (string, error) {
	return c.Get(ctx, key).Result()
}

// DeleteCache removes a value from Redis cache
func (c *Client) DeleteCache(ctx context.Context, key string) error {
	return c.Del(ctx, key).Err()
}

// IncrementCounter increments a counter in Redis
func (c *Client) IncrementCounter(ctx context.Context, key string, expiration time.Duration) (int64, error) {
	pipe := c.Pipeline()
	incr := pipe.Incr(ctx, key)
	pipe.Expire(ctx, key, expiration)
	_, err := pipe.Exec(ctx)
	if err != nil {
		return 0, err
	}
	return incr.Val(), nil
}

// Global Redis client instance
var redisClient *Client

// InitRedis initializes the Redis connection
func InitRedis(redisURL string) error {
	// Parse Redis URL (simplified for now)
	// For now, use default config
	cfg := Config{
		Host:     "localhost",
		Port:     6379,
		Password: "",
		DB:       0,
	}

	client, err := NewConnection(cfg)
	if err != nil {
		return err
	}

	redisClient = client
	return nil
}

// CloseRedis closes the Redis connection
func CloseRedis() error {
	if redisClient != nil {
		return redisClient.Close()
	}
	return nil
}

// HealthCheck checks if Redis is healthy
func HealthCheck(ctx context.Context) error {
	if redisClient != nil {
		return redisClient.Health(ctx)
	}
	return fmt.Errorf("Redis client not initialized")
}

// GetRedisClient returns the global Redis client
func GetRedisClient() *Client {
	return redisClient
}
