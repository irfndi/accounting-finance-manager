package repositories

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"finance-manager/internal/models"
)

// SessionRepository defines the interface for session data operations
type SessionRepository interface {
	Create(session *models.Session) error
	GetByToken(token string) (*models.Session, error)
	GetByUserID(userID uuid.UUID) ([]*models.Session, error)
	Update(session *models.Session) error
	Delete(id uint) error
	DeleteByToken(token string) error
	DeleteByUserID(userID uuid.UUID) error
	DeleteExpired() error
	IsValidToken(token string) (bool, error)
}

// sessionRepository implements SessionRepository interface
type sessionRepository struct {
	db *gorm.DB
}

// NewSessionRepository creates a new session repository
func NewSessionRepository(db *gorm.DB) SessionRepository {
	return &sessionRepository{
		db: db,
	}
}

// Create creates a new session in the database
func (r *sessionRepository) Create(session *models.Session) error {
	if err := r.db.Create(session).Error; err != nil {
		return err
	}
	return nil
}

// GetByToken retrieves a session by token
func (r *sessionRepository) GetByToken(token string) (*models.Session, error) {
	var session models.Session
	if err := r.db.Where("token = ? AND expires_at > ?", token, time.Now()).First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrInvalidToken
		}
		return nil, err
	}
	return &session, nil
}

// GetByUserID retrieves all active sessions for a user
func (r *sessionRepository) GetByUserID(userID uuid.UUID) ([]*models.Session, error) {
	var sessions []*models.Session
	if err := r.db.Where("user_id = ? AND expires_at > ?", userID, time.Now()).Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

// Update updates an existing session
func (r *sessionRepository) Update(session *models.Session) error {
	result := r.db.Save(session)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return models.ErrInvalidToken
	}
	return nil
}

// Delete soft deletes a session by ID
func (r *sessionRepository) Delete(id uint) error {
	result := r.db.Delete(&models.Session{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return models.ErrInvalidToken
	}
	return nil
}

// DeleteByToken deletes a session by token
func (r *sessionRepository) DeleteByToken(token string) error {
	result := r.db.Where("token = ?", token).Delete(&models.Session{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return models.ErrInvalidToken
	}
	return nil
}

// DeleteByUserID deletes all sessions for a user
func (r *sessionRepository) DeleteByUserID(userID uuid.UUID) error {
	if err := r.db.Where("user_id = ?", userID).Delete(&models.Session{}).Error; err != nil {
		return err
	}
	return nil
}

// DeleteExpired deletes all expired sessions
func (r *sessionRepository) DeleteExpired() error {
	if err := r.db.Where("expires_at <= ?", time.Now()).Delete(&models.Session{}).Error; err != nil {
		return err
	}
	return nil
}

// IsValidToken checks if a token is valid and not expired
func (r *sessionRepository) IsValidToken(token string) (bool, error) {
	var count int64
	if err := r.db.Model(&models.Session{}).Where("token = ? AND expires_at > ?", token, time.Now()).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
