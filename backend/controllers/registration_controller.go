package controllers

import (
	"encoding/json"
	"errors"
	"hackathon-platform/backend/repositories"
	"hackathon-platform/backend/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RegistrationController struct {
	service services.RegistrationService
}

func NewRegistrationController(db *gorm.DB) *RegistrationController {
	registrationRepo := repositories.NewRegistrationRepository(db)
	teamRepo := repositories.NewTeamRepository(db)
	eventRepo := repositories.NewEventRepository(db)
	service := services.NewRegistrationService(registrationRepo, teamRepo, eventRepo)
	return &RegistrationController{service: service}
}

// CreateRegistration creates a new registration
func (c *RegistrationController) CreateRegistration(ctx *gin.Context) {
	// Manually decode JSON to handle optional fields properly
	var rawData map[string]interface{}
	if err := json.NewDecoder(ctx.Request.Body).Decode(&rawData); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid JSON: " + err.Error()})
		return
	}

	// Build request struct manually
	var req services.CreateRegistrationRequest
	
	// Parse event_id (required)
	if eventIDVal, ok := rawData["event_id"]; ok {
		if eventIDFloat, ok := eventIDVal.(float64); ok {
			req.EventID = uint(eventIDFloat)
		} else {
			ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "event_id must be a number"})
			return
		}
	} else {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "event_id is required"})
		return
	}

	// Parse team_id (optional)
	if teamIDVal, ok := rawData["team_id"]; ok && teamIDVal != nil {
		if teamIDFloat, ok := teamIDVal.(float64); ok && teamIDFloat > 0 {
			teamID := uint(teamIDFloat)
			req.TeamID = &teamID
		}
	}

	// Parse wallet_address (optional, but required if team_id is not provided)
	if walletAddrVal, ok := rawData["wallet_address"]; ok {
		if walletAddr, ok := walletAddrVal.(string); ok {
			req.WalletAddress = walletAddr
		}
	}

	// Parse optional fields
	if projectNameVal, ok := rawData["project_name"]; ok {
		if projectName, ok := projectNameVal.(string); ok {
			req.ProjectName = projectName
		}
	}

	if projectDescVal, ok := rawData["project_description"]; ok {
		if projectDesc, ok := projectDescVal.(string); ok {
			req.ProjectDescription = projectDesc
		}
	}

	registration, err := c.service.CreateRegistration(&req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, registration)
}

// ListRegistrationsByEvent retrieves all registrations for an event
func (c *RegistrationController) ListRegistrationsByEvent(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	registrations, err := c.service.GetRegistrationsByEvent(uint(eventID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, registrations)
}

// GetRegistration retrieves a registration by ID
func (c *RegistrationController) GetRegistration(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid registration ID"})
		return
	}

	registration, err := c.service.GetRegistration(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Registration not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, registration)
}

// ApproveRegistration approves a registration (organizer only)
func (c *RegistrationController) ApproveRegistration(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid registration ID"})
		return
	}

	var req struct {
		OrganizerAddress string `json:"organizer_address" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	registration, err := c.service.ApproveRegistration(uint(id), req.OrganizerAddress)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, registration)
}

// RejectRegistration rejects a registration (organizer only)
func (c *RegistrationController) RejectRegistration(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid registration ID"})
		return
	}

	var req struct {
		OrganizerAddress string `json:"organizer_address" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	registration, err := c.service.RejectRegistration(uint(id), req.OrganizerAddress)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, registration)
}

// UpdateSBTStatus updates the SBT minting status
func (c *RegistrationController) UpdateSBTStatus(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid registration ID"})
		return
	}

	var req struct {
		TokenID uint64 `json:"token_id" binding:"required"`
		TxHash  string `json:"tx_hash" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	registration, err := c.service.UpdateSBTStatus(uint(id), req.TokenID, req.TxHash)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, registration)
}

// DeleteRegistration deletes a registration
func (c *RegistrationController) DeleteRegistration(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid registration ID"})
		return
	}

	err = c.service.DeleteRegistration(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Registration not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Registration deleted successfully"})
}

