package services

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"finance-manager/internal/models"
	"finance-manager/internal/repositories"
)

// UserService defines the interface for user business logic
type UserService interface {
	Register(req *models.CreateUserRequest) (*models.UserResponse, error)
	Login(req *models.LoginRequest) (*models.LoginResponse, error)
	Logout(token string) error
	GetProfile(userID uuid.UUID) (*models.UserResponse, error)
	UpdateProfile(userID uuid.UUID, req *models.UpdateUserRequest) (*models.UserResponse, error)
	DeleteAccount(userID uuid.UUID) error
	ChangePassword(userID uuid.UUID, oldPassword, newPassword string) error
	ValidateSession(token string) (*models.User, error)
}

// userService implements UserService interface
type userService struct {
	userRepo    repositories.UserRepository
	sessionRepo repositories.SessionRepository
	jwtSecret   string
	jwtExpiry   time.Duration
}

// NewUserService creates a new user service
func NewUserService(userRepo repositories.UserRepository, sessionRepo repositories.SessionRepository, jwtSecret string, jwtExpiry time.Duration) UserService {
	return &userService{
		userRepo:    userRepo,
		sessionRepo: sessionRepo,
		jwtSecret:   jwtSecret,
		jwtExpiry:   jwtExpiry,
	}
}

// Register creates a new user account
func (s *userService) Register(req *models.CreateUserRequest) (*models.UserResponse, error) {
	// Check if user already exists
	existingUser, _ := s.userRepo.GetByEmail(req.Email)
	if existingUser != nil {
		return nil, models.ErrUserExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Name:         req.Name,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	// Return user response (without password)
	return &models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: "", // Will need to split name if needed
		LastName:  "", // Will need to split name if needed
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}, nil
}

// Login authenticates a user and creates a session
func (s *userService) Login(req *models.LoginRequest) (*models.LoginResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, models.ErrInvalidCredentials
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, models.ErrInvalidCredentials
	}

	// Generate session token
	token, err := s.generateSessionToken()
	if err != nil {
		return nil, err
	}

	// Create session
	session := &models.Session{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(s.jwtExpiry),
	}

	if err := s.sessionRepo.Create(session); err != nil {
		return nil, err
	}

	// Return login response
	return &models.LoginResponse{
		User:  *user,
		Token: token,
	}, nil
}

// Logout invalidates a user session
func (s *userService) Logout(token string) error {
	return s.sessionRepo.DeleteByToken(token)
}

// GetProfile retrieves user profile information
func (s *userService) GetProfile(userID uuid.UUID) (*models.UserResponse, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	return &models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: "", // Will need to split name if needed
		LastName:  "", // Will need to split name if needed
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}, nil
}

// UpdateProfile updates user profile information
func (s *userService) UpdateProfile(userID uuid.UUID, req *models.UpdateUserRequest) (*models.UserResponse, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}

	// Update email if provided
	if req.Email != nil && *req.Email != "" {
		user.Email = *req.Email
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return &models.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: "", // Will need to split name if needed
		LastName:  "", // Will need to split name if needed
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}, nil
}

// DeleteAccount deletes a user account and all associated data
func (s *userService) DeleteAccount(userID uuid.UUID) error {
	// Delete all user sessions
	if err := s.sessionRepo.DeleteByUserID(userID); err != nil {
		return err
	}

	// Delete user account
	return s.userRepo.Delete(userID)
}

// ChangePassword changes a user's password
func (s *userService) ChangePassword(userID uuid.UUID, oldPassword, newPassword string) error {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return err
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return models.ErrInvalidCredentials
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Update password
	user.PasswordHash = string(hashedPassword)
	return s.userRepo.Update(user)
}

// ValidateSession validates a session token and returns the associated user
func (s *userService) ValidateSession(token string) (*models.User, error) {
	session, err := s.sessionRepo.GetByToken(token)
	if err != nil {
		return nil, err
	}

	// Check if session is expired
	if session.IsExpired() {
		// Clean up expired session
		s.sessionRepo.DeleteByToken(token)
		return nil, models.ErrInvalidToken
	}

	// Get user
	user, err := s.userRepo.GetByID(session.UserID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// generateSessionToken generates a secure random session token
func (s *userService) generateSessionToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
