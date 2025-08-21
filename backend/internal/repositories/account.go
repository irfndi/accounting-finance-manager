package repositories

import (
	"errors"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"

	"finance-manager/internal/models"
)

// AccountRepository defines the interface for account data operations
type AccountRepository interface {
	Create(account *models.Account) error
	GetByID(id uuid.UUID) (*models.Account, error)
	GetByUserID(userID uuid.UUID) ([]*models.Account, error)
	GetByUserIDAndType(userID uuid.UUID, accountType models.AccountType) ([]*models.Account, error)
	Update(account *models.Account) error
	Delete(id uuid.UUID) error
	GetSummaryByUserID(userID uuid.UUID) ([]*models.AccountTypeSummary, error)
	GetTotalBalanceByUserID(userID uuid.UUID) (float64, error)
	UpdateBalance(accountID uuid.UUID, newBalance decimal.Decimal) error
}

// accountRepository implements AccountRepository interface
type accountRepository struct {
	db *gorm.DB
}

// NewAccountRepository creates a new account repository
func NewAccountRepository(db *gorm.DB) AccountRepository {
	return &accountRepository{
		db: db,
	}
}

// Create creates a new account in the database
func (r *accountRepository) Create(account *models.Account) error {
	if err := r.db.Create(account).Error; err != nil {
		return err
	}
	return nil
}

// GetByID retrieves an account by ID
func (r *accountRepository) GetByID(id uuid.UUID) (*models.Account, error) {
	var account models.Account
	if err := r.db.Where("id = ?", id).First(&account).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrAccountNotFound
		}
		return nil, err
	}
	return &account, nil
}

// GetByUserID retrieves all accounts for a user
func (r *accountRepository) GetByUserID(userID uuid.UUID) ([]*models.Account, error) {
	var accounts []*models.Account
	if err := r.db.Where("user_id = ? AND is_active = ?", userID, true).Order("created_at DESC").Find(&accounts).Error; err != nil {
		return nil, err
	}
	return accounts, nil
}

// GetByUserIDAndType retrieves accounts by user ID and account type
func (r *accountRepository) GetByUserIDAndType(userID uuid.UUID, accountType models.AccountType) ([]*models.Account, error) {
	var accounts []*models.Account
	if err := r.db.Where("user_id = ? AND type = ? AND is_active = ?", userID, accountType, true).Order("created_at DESC").Find(&accounts).Error; err != nil {
		return nil, err
	}
	return accounts, nil
}

// Update updates an existing account
func (r *accountRepository) Update(account *models.Account) error {
	result := r.db.Save(account)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return models.ErrAccountNotFound
	}
	return nil
}

// Delete soft deletes an account by ID
func (r *accountRepository) Delete(id uuid.UUID) error {
	// Instead of hard delete, we set is_active to false
	result := r.db.Model(&models.Account{}).Where("id = ?", id).Update("is_active", false)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return models.ErrAccountNotFound
	}
	return nil
}

// GetSummaryByUserID retrieves account summary grouped by type for a user
func (r *accountRepository) GetSummaryByUserID(userID uuid.UUID) ([]*models.AccountTypeSummary, error) {
	var summaries []*models.AccountTypeSummary
	if err := r.db.Model(&models.Account{}).
		Select("type, COUNT(*) as count, SUM(balance) as total_balance").
		Where("user_id = ? AND is_active = ?", userID, true).
		Group("type").
		Scan(&summaries).Error; err != nil {
		return nil, err
	}
	return summaries, nil
}

// GetTotalBalanceByUserID calculates the total balance across all accounts for a user
func (r *accountRepository) GetTotalBalanceByUserID(userID uuid.UUID) (float64, error) {
	var totalBalance float64
	if err := r.db.Model(&models.Account{}).
		Select("COALESCE(SUM(balance), 0)").
		Where("user_id = ? AND is_active = ?", userID, true).
		Scan(&totalBalance).Error; err != nil {
		return 0, err
	}
	return totalBalance, nil
}

// UpdateBalance updates the balance of a specific account
func (r *accountRepository) UpdateBalance(accountID uuid.UUID, newBalance decimal.Decimal) error {
	result := r.db.Model(&models.Account{}).Where("id = ?", accountID).Update("balance", newBalance)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return models.ErrAccountNotFound
	}
	return nil
}
