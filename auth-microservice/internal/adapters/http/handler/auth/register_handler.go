package auth

import (
	"encoding/json"
	"fmt"
	nethttp "net/http"

	"go.uber.org/zap"

	"github.com/kristianrpo/auth-microservice/internal/adapters/http/dto/request"
	"github.com/kristianrpo/auth-microservice/internal/adapters/http/dto/response"
	httperrors "github.com/kristianrpo/auth-microservice/internal/adapters/http/errors"
	"github.com/kristianrpo/auth-microservice/internal/adapters/http/handler/shared"
	"github.com/kristianrpo/auth-microservice/internal/observability/metrics"
)

// Register handles new user registration
// @Summary Register a new user
// @Description Create a new user account in the system
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body request.RegisterRequest true "User registration data"
// @Success 201 {object} response.UserResponse "User created successfully"
// @Failure 400 {object} response.ErrorResponse "Invalid request or missing data"
// @Failure 409 {object} response.ErrorResponse "User already exists"
// @Failure 500 {object} response.ErrorResponse "Internal server error"
// @Router /register [post]
func Register(h *shared.AuthHandler) nethttp.HandlerFunc {
	return func(w nethttp.ResponseWriter, r *nethttp.Request) {
		metrics.IncRegisterRequests()

		var req request.RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			h.Logger.Debug("invalid request body", zap.Error(err))
			httperrors.RespondWithError(w, httperrors.ErrInvalidRequestBody)
			return
		}

		// Basic validations
		if req.IDCitizen <= 0 || req.Email == "" || req.Password == "" || req.Name == "" {
			httperrors.RespondWithError(w, httperrors.ErrRequiredField)
			return
		}

	// Validate IDCitizen length (must be exactly 10 digits)
	idCitizenStr := fmt.Sprintf("%d", req.IDCitizen)
	if len(idCitizenStr) != 10 {
		h.Logger.Debug("invalid id_citizen length", zap.Int("id_citizen", req.IDCitizen), zap.Int("length", len(idCitizenStr)))
		invalidLengthErr := httperrors.NewHTTPError(400, "id_citizen must be exactly 10 digits", "INVALID_ID_CITIZEN_LENGTH")
		httperrors.RespondWithError(w, invalidLengthErr)
		return
	}

	// Register user		// Register user
		user, err := h.AuthService.Register(r.Context(), req.Email, req.Password, req.Name, req.IDCitizen)
		if err != nil {
			// Use Warn for expected business errors (like user already exists), Error for unexpected failures
			h.Logger.Warn("failed to register user", zap.Error(err), zap.String("email", req.Email))
			httperrors.RespondWithDomainError(w, err)
			return
		}

		// Convert to DTO
		resp := response.UserResponse{
			ID:        user.ID,
			IDCitizen: user.IDCitizen,
			Email:     user.Email,
			Name:      user.Name,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
		}

		shared.RespondWithJSON(w, nethttp.StatusCreated, resp)
	}
}
