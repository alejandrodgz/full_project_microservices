package external

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"go.uber.org/zap"
)

// CitizenValidationResponse represents the response from the citizen validation API
type CitizenValidationResponse struct {
	Exists       bool                   `json:"exists"`
	CitizenData  map[string]interface{} `json:"citizen_data,omitempty"`
	Message      string                 `json:"message"`
	StatusCode   int                    `json:"status_code"`
}

// CitizenValidator validates citizens against external API
type CitizenValidator interface {
	ValidateCitizen(ctx context.Context, citizenID int) (*CitizenValidationResponse, error)
}

// GovcarpetaValidator implements CitizenValidator using the Govcarpeta API
type GovcarpetaValidator struct {
	baseURL        string
	apiKey         string
	serviceUser    string
	servicePass    string
	httpClient     *http.Client
	logger         *zap.Logger
	cachedToken    string
	tokenExpiresAt time.Time
}

// NewGovcarpetaValidator creates a new instance of GovcarpetaValidator
func NewGovcarpetaValidator(baseURL, apiKey string, logger *zap.Logger) *GovcarpetaValidator {
	return &GovcarpetaValidator{
		baseURL:     baseURL,
		apiKey:      apiKey,
		serviceUser: "auth-service",
		servicePass: "auth-service-pass-123",
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		logger: logger,
	}
}

// getAuthToken retrieves a valid authentication token for the Affiliation service
func (v *GovcarpetaValidator) getAuthToken(ctx context.Context) (string, error) {
	// Check if we have a cached token that hasn't expired
	if v.cachedToken != "" && time.Now().Before(v.tokenExpiresAt) {
		return v.cachedToken, nil
	}

	// Login to get a new token (using Django Simple JWT endpoint)
	loginURL := fmt.Sprintf("%s/api/v1/token/", v.baseURL)
	
	loginBody := map[string]string{
		"username": v.serviceUser,
		"password": v.servicePass,
	}
	jsonBody, err := json.Marshal(loginBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal login request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, loginURL, strings.NewReader(string(jsonBody)))
	if err != nil {
		return "", fmt.Errorf("failed to create login request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := v.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to execute login request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		v.logger.Error("login failed",
			zap.Int("status_code", resp.StatusCode),
			zap.String("body", string(body)))
		return "", fmt.Errorf("login failed with status %d", resp.StatusCode)
	}

	var loginResp struct {
		AccessToken string `json:"access"` // Django Simple JWT uses "access" not "access_token"
	}
	if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
		return "", fmt.Errorf("failed to decode login response: %w", err)
	}

	// Cache the token (assume it's valid for 14 minutes, refresh at 15 min expiry)
	v.cachedToken = loginResp.AccessToken
	v.tokenExpiresAt = time.Now().Add(14 * time.Minute)

	v.logger.Info("successfully authenticated with affiliation service")
	
	return loginResp.AccessToken, nil
}

// ValidateCitizen validates if a citizen exists in the external system
func (v *GovcarpetaValidator) ValidateCitizen(ctx context.Context, citizenID int) (*CitizenValidationResponse, error) {
	// Get authentication token
	token, err := v.getAuthToken(ctx)
	if err != nil {
		v.logger.Error("failed to get authentication token", zap.Error(err))
		return nil, fmt.Errorf("failed to authenticate: %w", err)
	}

	// Call the Affiliation microservice instead of external API directly
	// Endpoint: POST /api/v1/affiliation/check/
	// Body: {"citizen_id": "1234567890"}
	url := fmt.Sprintf("%s/api/v1/affiliation/check/", v.baseURL)

	v.logger.Info("validating citizen with affiliation microservice",
		zap.Int("citizen_id", citizenID),
		zap.String("url", url))

	// Prepare request body
	requestBody := map[string]string{
		"citizen_id": fmt.Sprintf("%d", citizenID),
	}
	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		v.logger.Error("failed to marshal request body", zap.Error(err))
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Create request
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(string(jsonBody)))
	if err != nil {
		v.logger.Error("failed to create request", zap.Error(err))
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add headers - use Bearer token authentication
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	// Make request
	resp, err := v.httpClient.Do(req)
	if err != nil {
		v.logger.Error("failed to call affiliation microservice", zap.Error(err))
		return nil, fmt.Errorf("failed to call affiliation microservice: %w", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		v.logger.Error("failed to read response body", zap.Error(err))
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	v.logger.Debug("affiliation microservice response",
		zap.Int("status_code", resp.StatusCode),
		zap.String("body", string(body)))

	// Handle different status codes
	switch resp.StatusCode {
	case http.StatusOK:
		// Status 200: Citizen is eligible (NOT affiliated yet - CAN create)
		// Parse the response to get detailed information
		var responseData map[string]interface{}
		if err := json.Unmarshal(body, &responseData); err != nil {
			v.logger.Warn("failed to parse affiliation response as JSON", zap.Error(err))
			// Even if parsing fails, we know 200 means eligible
			return &CitizenValidationResponse{
				Exists:  false, // Not affiliated yet - can proceed with registration
				Message: "Citizen is eligible for registration",
			}, nil
		}

		message := "Citizen is eligible for registration"
		if msg, ok := responseData["message"].(string); ok {
			message = msg
		}

		return &CitizenValidationResponse{
			Exists:  false, // Not affiliated yet - can proceed with registration
			Message: message,
		}, nil

	case http.StatusNoContent:
		// Status 204: Citizen already affiliated (CANNOT create duplicate)
		return &CitizenValidationResponse{
			Exists:  true, // Already affiliated - cannot create duplicate
			Message: "Citizen is already affiliated and cannot be registered again",
		}, nil

	case http.StatusBadRequest:
		// Status 400: Invalid request
		message := "Invalid citizen ID format"
		if len(body) > 0 {
			var errorData map[string]interface{}
			if err := json.Unmarshal(body, &errorData); err == nil {
				if msg, ok := errorData["error"].(string); ok {
					message = msg
				}
			}
		}
		v.logger.Warn("bad request from affiliation service",
			zap.String("message", message))
		return nil, fmt.Errorf("bad request: %s", message)

	case http.StatusNotFound:
		// Status 404: Citizen not found (may have body)
		message := "Citizen not found in government system"
		if len(body) > 0 {
			// Try to parse as JSON first
			var jsonMsg map[string]interface{}
			if err := json.Unmarshal(body, &jsonMsg); err == nil {
				if msg, ok := jsonMsg["message"].(string); ok {
					message = msg
				}
			} else {
				// If not JSON, use the string response
				message = strings.TrimSpace(string(body))
			}
		}
		return &CitizenValidationResponse{
			Exists:  false, // Not registered - can proceed with registration
			Message: message,
		}, nil

	default:
		v.logger.Error("unexpected status code from affiliation microservice",
			zap.Int("status_code", resp.StatusCode),
			zap.String("body", string(body)))
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}
}
