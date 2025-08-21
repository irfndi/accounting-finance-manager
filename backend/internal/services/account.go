package services

import (
	"fmt"
	"time"

	"finance-manager/internal/models"
	"finance-manager/internal/repositories"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// AccountService defines the interface for account business logic
type AccountService interface {
	Create(userID uuid.UUID, req *models.CreateAccountRequest) (*models.AccountResponse, error)
	GetByID(accountID uuid.UUID) (*models.AccountResponse, error)
	GetByUserID(userID uuid.UUID) ([]*models.AccountResponse, error)
	GetByUserIDAndType(userID uuid.UUID, accountType models.AccountType) ([]*models.AccountResponse, error)
	Update(accountID uuid.UUID, req *models.UpdateAccountRequest) (*models.AccountResponse, error)
	Delete(accountID uuid.UUID) error
	GetSummary(userID uuid.UUID) (*models.AccountSummary, error)
	UpdateBalance(accountID uuid.UUID, newBalance decimal.Decimal) error
	TransferFunds(fromAccountID, toAccountID uuid.UUID, amount decimal.Decimal, description string) error
	GetChartOfAccounts(userID uuid.UUID) ([]*models.AccountResponse, error)
	GetAccountBalances(userID uuid.UUID) ([]*models.AccountResponse, error)
}

// accountService implements AccountService interface
type accountService struct {
	accountRepo     repositories.AccountRepository
	transactionRepo repositories.TransactionRepository
}

// NewAccountService creates a new account service
func NewAccountService(accountRepo repositories.AccountRepository, transactionRepo repositories.TransactionRepository) AccountService {
	return &accountService{
		accountRepo:     accountRepo,
		transactionRepo: transactionRepo,
	}
}

// Create creates a new account for a user
func (s *accountService) Create(userID uuid.UUID, req *models.CreateAccountRequest) (*models.AccountResponse, error) {
	account := &models.Account{
		ID:          uuid.New(),
		Code:        req.Code,
		Name:        req.Name,
		AccountType: req.AccountType,
		ParentID:    req.ParentID,
		Balance:     decimal.NewFromFloat(0.0),
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.accountRepo.Create(account); err != nil {
		return nil, err
	}

	return s.toAccountResponse(account), nil
}

// GetByID retrieves an account by ID
func (s *accountService) GetByID(accountID uuid.UUID) (*models.AccountResponse, error) {
	account, err := s.accountRepo.GetByID(accountID)
	if err != nil {
		return nil, err
	}

	return s.toAccountResponse(account), nil
}

// GetByUserID retrieves all accounts for a user
func (s *accountService) GetByUserID(userID uuid.UUID) ([]*models.AccountResponse, error) {
	accounts, err := s.accountRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	var responses []*models.AccountResponse
	for _, account := range accounts {
		responses = append(responses, s.toAccountResponse(account))
	}

	return responses, nil
}

// GetByUserIDAndType retrieves accounts by user ID and account type
func (s *accountService) GetByUserIDAndType(userID uuid.UUID, accountType models.AccountType) ([]*models.AccountResponse, error) {
	accounts, err := s.accountRepo.GetByUserIDAndType(userID, accountType)
	if err != nil {
		return nil, err
	}

	var responses []*models.AccountResponse
	for _, account := range accounts {
		responses = append(responses, s.toAccountResponse(account))
	}

	return responses, nil
}

// Update updates an existing account
func (s *accountService) Update(accountID uuid.UUID, req *models.UpdateAccountRequest) (*models.AccountResponse, error) {
	account, err := s.accountRepo.GetByID(accountID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Name != "" {
		account.Name = req.Name
	}
	if req.ParentID != nil {
		account.ParentID = req.ParentID
	}
	if req.IsActive != nil {
		account.IsActive = *req.IsActive
	}
	account.UpdatedAt = time.Now()

	if err := s.accountRepo.Update(account); err != nil {
		return nil, err
	}

	return s.toAccountResponse(account), nil
}

// Delete deactivates an account
func (s *accountService) Delete(accountID uuid.UUID) error {
	// Check if account exists
	_, err := s.accountRepo.GetByID(accountID)
	if err != nil {
		return err
	}

	// Soft delete (deactivate) the account
	return s.accountRepo.Delete(accountID)
}

// GetSummary retrieves account summary for a user
func (s *accountService) GetSummary(userID uuid.UUID) (*models.AccountSummary, error) {
	// Get all accounts for count and total balance calculation
	accounts, err := s.accountRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}

	// Calculate total balance
	totalBalance := decimal.NewFromFloat(0)
	for _, account := range accounts {
		totalBalance = totalBalance.Add(account.Balance)
	}

	// For now, return a basic summary
	// This can be enhanced later with proper account type grouping
	return &models.AccountSummary{
		AccountType:  models.AccountTypeAsset, // Default type
		TotalBalance: totalBalance,
		AccountCount: len(accounts),
	}, nil
}

// UpdateBalance updates the balance of a specific account
func (s *accountService) UpdateBalance(accountID uuid.UUID, newBalance decimal.Decimal) error {
	// Validate account exists
	_, err := s.accountRepo.GetByID(accountID)
	if err != nil {
		return err
	}

	// Update balance
	return s.accountRepo.UpdateBalance(accountID, newBalance)
}

// TransferFunds transfers money between two accounts
func (s *accountService) TransferFunds(fromAccountID, toAccountID uuid.UUID, amount decimal.Decimal, description string) error {
	if amount.LessThanOrEqual(decimal.Zero) {
		return fmt.Errorf("invalid amount")
	}

	// Get source account
	fromAccount, err := s.accountRepo.GetByID(fromAccountID)
	if err != nil {
		return err
	}

	// Get destination account
	toAccount, err := s.accountRepo.GetByID(toAccountID)
	if err != nil {
		return err
	}

	// Check if source account has sufficient balance
	if fromAccount.Balance.LessThan(amount) {
		return fmt.Errorf("insufficient funds")
	}

	// Update balances
	fromAccount.Balance = fromAccount.Balance.Sub(amount)
	toAccount.Balance = toAccount.Balance.Add(amount)
	fromAccount.UpdatedAt = time.Now()
	toAccount.UpdatedAt = time.Now()

	// Save updated accounts
	if err := s.accountRepo.Update(fromAccount); err != nil {
		return err
	}

	if err := s.accountRepo.Update(toAccount); err != nil {
		// Rollback the first account update if second fails
		fromAccount.Balance = fromAccount.Balance.Add(amount)
		s.accountRepo.Update(fromAccount)
		return err
	}

	return nil
}

// GetChartOfAccounts retrieves the chart of accounts for a user
func (s *accountService) GetChartOfAccounts(userID uuid.UUID) ([]*models.AccountResponse, error) {
	return s.GetByUserID(userID)
}

// GetAccountBalances retrieves account balances for a user
func (s *accountService) GetAccountBalances(userID uuid.UUID) ([]*models.AccountResponse, error) {
	return s.GetByUserID(userID)
}

// toAccountResponse converts Account model to AccountResponse
func (s *accountService) toAccountResponse(account *models.Account) *models.AccountResponse {
	return &models.AccountResponse{
		ID:          account.ID,
		Code:        account.Code,
		Name:        account.Name,
		Type:        account.AccountType,
		Balance:     account.Balance,
		ParentID:    account.ParentID,
		Description: "", // Account model doesn't have Description field
		IsActive:    account.IsActive,
		CreatedAt:   account.CreatedAt,
		UpdatedAt:   account.UpdatedAt,
	}
}
