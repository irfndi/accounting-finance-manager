package vectorize

import (
	"context"
	"log/slog"
	"math"
)

// VectorizeConfig holds configuration for Vectorize
type VectorizeConfig struct {
	IndexName       string
	BindingName     string
	Dimensions      int
	Metric          string
	PredictionCount int
}

// Vector represents a vector embedding
type Vector struct {
	ID       string
	Values   []float64
	Metadata map[string]interface{}
}

// SearchResult represents a vector search result
type SearchResult struct {
	ID       string
	Score    float64
	Metadata map[string]interface{}
}

// VectorizeClient represents a Vectorize client
type VectorizeClient struct {
	config *VectorizeConfig
}

// NewVectorizeClient creates a new Vectorize client
func NewVectorizeClient(config *VectorizeConfig) *VectorizeClient {
	slog.Info("Vectorize client initialized",
		"index", config.IndexName,
		"binding", config.BindingName,
		"dimensions", config.Dimensions,
		"metric", config.Metric,
	)

	return &VectorizeClient{
		config: config,
	}
}

// Insert inserts or updates a vector in the index
func (v *VectorizeClient) Insert(ctx context.Context, vector Vector) error {
	if len(vector.Values) != v.config.Dimensions {
		return InvalidVectorDimensionError{
			Expected: v.config.Dimensions,
			Actual:   len(vector.Values),
		}
	}

	slog.Info("Inserting vector",
		"id", vector.ID,
		"dimensions", len(vector.Values),
	)

	return nil
}

// InsertMany inserts multiple vectors in a batch
func (v *VectorizeClient) InsertMany(ctx context.Context, vectors []Vector) error {
	slog.Info("Inserting vectors in batch",
		"count", len(vectors),
	)

	for _, vector := range vectors {
		if err := v.Insert(ctx, vector); err != nil {
			return err
		}
	}

	return nil
}

// Search performs a similarity search
func (v *VectorizeClient) Search(ctx context.Context, query []float64, topK int, namespace string) ([]SearchResult, error) {
	if len(query) != v.config.Dimensions {
		return nil, InvalidVectorDimensionError{
			Expected: v.config.Dimensions,
			Actual:   len(query),
		}
	}

	slog.Info("Searching vectors",
		"top_k", topK,
		"namespace", namespace,
	)

	return []SearchResult{}, nil
}

// Delete removes a vector from the index
func (v *VectorizeClient) Delete(ctx context.Context, id string) error {
	slog.Info("Deleting vector", "id", id)
	return nil
}

// DeleteByNamespace removes all vectors in a namespace
func (v *VectorizeClient) DeleteByNamespace(ctx context.Context, namespace string) error {
	slog.Info("Deleting vectors by namespace", "namespace", namespace)
	return nil
}

// InvalidVectorDimensionError is returned when vector dimensions don't match
type InvalidVectorDimensionError struct {
	Expected int
	Actual   int
}

func (e InvalidVectorDimensionError) Error() string {
	return "invalid vector dimension: expected " + string(rune(e.Expected)) + ", got " + string(rune(e.Actual))
}

// CosineSimilarity calculates cosine similarity between two vectors
func CosineSimilarity(a, b []float64) (float64, error) {
	if len(a) != len(b) {
		return 0, InvalidVectorDimensionError{
			Expected: len(a),
			Actual:   len(b),
		}
	}

	var dotProduct, normA, normB float64
	for i := range a {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	if normA == 0 || normB == 0 {
		return 0, nil
	}

	return dotProduct / (math.Sqrt(normA) * math.Sqrt(normB)), nil
}
