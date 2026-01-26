package api

import (
	"net/http"
)

func TransactionsHandler(w http.ResponseWriter, r *http.Request) {
	MessageResponse(w, http.StatusOK, "Transactions endpoint - to be implemented")
}

func AccountsHandler(w http.ResponseWriter, r *http.Request) {
	MessageResponse(w, http.StatusOK, "Accounts endpoint - to be implemented")
}

func EntitiesHandler(w http.ResponseWriter, r *http.Request) {
	MessageResponse(w, http.StatusOK, "Entities endpoint - to be implemented")
}

func CreateTransactionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	SuccessResponse(w, map[string]interface{}{
		"message": "Create transaction endpoint - to be implemented",
	})
}

func GetTransactionHandler(w http.ResponseWriter, r *http.Request) {
	SuccessResponse(w, map[string]interface{}{
		"message": "Get transaction endpoint - to be implemented",
	})
}

func UpdateTransactionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut && r.Method != http.MethodPatch {
		ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	SuccessResponse(w, map[string]interface{}{
		"message": "Update transaction endpoint - to be implemented",
	})
}

func DeleteTransactionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	MessageResponse(w, http.StatusOK, "Delete transaction endpoint - to be implemented")
}
