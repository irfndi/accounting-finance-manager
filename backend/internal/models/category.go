package models

import (
	"time"

	"github.com/google/uuid"
)

// Category represents a transaction category
type Category struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	Description  string    `json:"description,omitempty" db:"description"`
	CategoryType string    `json:"category_type" db:"category_type"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// CreateCategoryRequest represents the request to create a new category
type CreateCategoryRequest struct {
	Name         string `json:"name" binding:"required,max=100"`
	Description  string `json:"description,omitempty"`
	CategoryType string `json:"category_type" binding:"required"`
}

// UpdateCategoryRequest represents the request to update a category
type UpdateCategoryRequest struct {
	Name        string `json:"name,omitempty" binding:"omitempty,max=100"`
	Description string `json:"description,omitempty"`
}

// RawDoc represents a raw document for processing
type RawDoc struct {
	ID               uuid.UUID              `json:"id" db:"id"`
	Filename         string                 `json:"filename" db:"filename"`
	ContentType      string                 `json:"content_type" db:"content_type"`
	ExtractedText    string                 `json:"extracted_text,omitempty" db:"extracted_text"`
	Metadata         map[string]interface{} `json:"metadata,omitempty" db:"metadata"`
	ProcessingStatus string                 `json:"processing_status" db:"processing_status"`
	CreatedAt        time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at" db:"updated_at"`
}

// ProcessingStatus represents document processing status
type ProcessingStatus string

const (
	ProcessingStatusPending    ProcessingStatus = "pending"
	ProcessingStatusProcessing ProcessingStatus = "processing"
	ProcessingStatusCompleted  ProcessingStatus = "completed"
	ProcessingStatusFailed     ProcessingStatus = "failed"
)

// UploadDocumentRequest represents the request to upload a document
type UploadDocumentRequest struct {
	Filename    string `json:"filename" binding:"required"`
	ContentType string `json:"content_type" binding:"required"`
}

// OCRResult represents the result of OCR processing
type OCRResult struct {
	Text       string                 `json:"text"`
	Confidence float64                `json:"confidence"`
	Metadata   map[string]interface{} `json:"metadata"`
}

// SmartCategorizationRequest represents a request for AI categorization
type SmartCategorizationRequest struct {
	Description string `json:"description" binding:"required"`
	Amount      string `json:"amount,omitempty"`
	Vendor      string `json:"vendor,omitempty"`
}

// SmartCategorizationResponse represents the AI categorization response
type SmartCategorizationResponse struct {
	SuggestedCategory string   `json:"suggested_category"`
	Confidence        float64  `json:"confidence"`
	Reasons           []string `json:"reasons"`
}
