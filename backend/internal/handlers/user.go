package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"finance-manager/internal/models"
	"finance-manager/internal/services"
)

// UserHandler handles user-related HTTP requests
type UserHandler struct {
	userService services.UserService
}

// NewUserHandler creates a new user handler
func NewUserHandler(userService services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// Register handles user registration
// @Summary Register a new user
// @Description Create a new user account
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.CreateUserRequest true "User registration data"
// @Success 201 {object} models.UserResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 409 {object} models.ErrorResponse
// @Router /auth/register [post]
func (h *UserHandler) Register(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest, err.Error()))
		return
	}

	user, err := h.userService.Register(&req)
	if err != nil {
		if err == models.ErrUserExists {
			c.JSON(http.StatusConflict, models.NewErrorResponse(models.ErrUserExists, err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusCreated, user)
}

// Login handles user authentication
// @Summary Login user
// @Description Authenticate user and return access token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "User login credentials"
// @Success 200 {object} models.LoginResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Router /auth/login [post]
func (h *UserHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest, err.Error()))
		return
	}

	response, err := h.userService.Login(&req)
	if err != nil {
		if err == models.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, models.NewErrorResponse(models.ErrInvalidCredentials, err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusOK, response)
}

// Logout handles user logout
// @Summary Logout user
// @Description Invalidate user session
// @Tags auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 401 {object} models.ErrorResponse
// @Router /auth/logout [post]
func (h *UserHandler) Logout(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, models.NewErrorResponse(models.ErrUnauthorized, "Authorization header is required"))
		return
	}

	// Remove "Bearer " prefix if present
	if len(token) > 7 && token[:7] == "Bearer " {
		token = token[7:]
	}

	if err := h.userService.Logout(token); err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully logged out"})
}

// GetProfile handles getting user profile
// @Summary Get user profile
// @Description Get current user's profile information
// @Tags users
// @Security BearerAuth
// @Produce json
// @Success 200 {object} models.UserResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Router /users/profile [get]
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.NewErrorResponse(models.ErrUnauthorized))
		return
	}

	user, err := h.userService.GetProfile(userID.(uuid.UUID))
	if err != nil {
		if err == models.ErrUserNotFound {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(models.ErrUserNotFound, err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateProfile handles updating user profile
// @Summary Update user profile
// @Description Update current user's profile information
// @Tags users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body models.UpdateUserRequest true "User update data"
// @Success 200 {object} models.UserResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Router /users/profile [put]
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.NewErrorResponse(models.ErrUnauthorized))
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest, err.Error()))
		return
	}

	user, err := h.userService.UpdateProfile(userID.(uuid.UUID), &req)
	if err != nil {
		if err == models.ErrUserNotFound {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(models.ErrUserNotFound, err.Error()))
			return
		}
		if err == models.ErrUserExists {
			c.JSON(http.StatusConflict, models.NewErrorResponse(models.ErrUserExists, err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusOK, user)
}

// DeleteAccount handles account deletion
// @Summary Delete user account
// @Description Delete current user's account and all associated data
// @Tags users
// @Security BearerAuth
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Router /users/account [delete]
func (h *UserHandler) DeleteAccount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.NewErrorResponse(models.ErrUnauthorized))
		return
	}

	if err := h.userService.DeleteAccount(userID.(uuid.UUID)); err != nil {
		if err == models.ErrUserNotFound {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(models.ErrUserNotFound, err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account successfully deleted"})
}

// ChangePassword handles password change
// @Summary Change user password
// @Description Change current user's password
// @Tags users
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body object{old_password=string,new_password=string} true "Password change data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Router /users/change-password [post]
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.NewErrorResponse(models.ErrUnauthorized))
		return
	}

	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest, err.Error()))
		return
	}

	if err := h.userService.ChangePassword(userID.(uuid.UUID), req.OldPassword, req.NewPassword); err != nil {
		if err == models.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, models.NewErrorResponse(models.ErrInvalidCredentials, err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password successfully changed"})
}

// GetUserByID handles getting user by ID (admin only)
// @Summary Get user by ID
// @Description Get user information by ID (admin only)
// @Tags users
// @Security BearerAuth
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {object} models.UserResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Router /users/{id} [get]
func (h *UserHandler) GetUserByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest, "Invalid user ID format"))
		return
	}

	user, err := h.userService.GetProfile(id)
	if err != nil {
		if err == models.ErrUserNotFound {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(models.ErrUserNotFound, err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusOK, user)
}
