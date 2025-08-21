package models

import "errors"

// Common application errors
var (
	// Authentication errors
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrUnauthorized       = errors.New("unauthorized access")

	// User errors
	ErrUserNotFound = errors.New("user not found")
	ErrUserExists   = errors.New("user already exists")

	// Account errors
	ErrAccountNotFound   = errors.New("account not found")
	ErrAccountExists     = errors.New("account already exists")
	ErrInsufficientFunds = errors.New("insufficient funds")
	ErrInvalidAmount     = errors.New("invalid amount")

	// Transaction errors
	ErrTransactionNotFound = errors.New("transaction not found")
	ErrTransactionFailed   = errors.New("transaction failed")

	// General errors
	ErrInternalServer = errors.New("internal server error")
	ErrBadRequest     = errors.New("bad request")
	ErrNotFound       = errors.New("resource not found")
	ErrForbidden      = errors.New("access forbidden")
)

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    string `json:"code,omitempty"`
}

// NewErrorResponse creates a new error response
func NewErrorResponse(err error, message ...string) ErrorResponse {
	response := ErrorResponse{
		Error: err.Error(),
	}

	if len(message) > 0 {
		response.Message = message[0]
	}

	return response
}
