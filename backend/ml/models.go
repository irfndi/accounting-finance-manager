package ml

import "time"

// Embedding represents a vector embedding for semantic search
type Embedding struct {
	ID         string    `json:"id"`
	DocumentID string    `json:"documentId"`
	Vector     []float64 `json:"vector"`
	Dimensions int       `json:"dimensions"`
	CreatedAt  time.Time `json:"createdAt"`
}

// CategoryPrediction represents ML categorization result
type CategoryPrediction struct {
	Category   string   `json:"category"`
	Confidence float64  `json:"confidence"`
	Labels     []string `json:"labels,omitempty"`
}

// DocumentAnalysis represents document extraction result
type DocumentAnalysis struct {
	Type       string                 `json:"type"` // receipt, invoice, statement
	Amount     *float64               `json:"amount,omitempty"`
	Date       *time.Time             `json:"date,omitempty"`
	Vendor     string                 `json:"vendor,omitempty"`
	Currency   string                 `json:"currency,omitempty"`
	Confidence float64                `json:"confidence"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

// TransactionRecommendation represents ML-based suggestions
type TransactionRecommendation struct {
	TransactionID       string                  `json:"transactionId"`
	RecommendedCategory string                  `json:"recommendedCategory"`
	SimilarTransactions []TransactionSimilarity `json:"similarTransactions,omitempty"`
	AmountPrediction    *float64                `json:"amountPrediction,omitempty"`
}

// TransactionSimilarity represents similar transaction for recommendations
type TransactionSimilarity struct {
	TransactionID string  `json:"transactionId"`
	Similarity    float64 `json:"similarity"`
	Category      string  `json:"category"`
	Description   string  `json:"description"`
}

// TrainingData represents data for ML model training
type TrainingData struct {
	ID        string    `json:"id"`
	Features  string    `json:"features"` // JSON string of features
	Labels    string    `json:"labels"`   // Target category/type
	Embedding []float64 `json:"embedding"`
	CreatedAt time.Time `json:"createdAt"`
}
