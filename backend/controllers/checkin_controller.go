package controllers

import (
	"errors"
	"hackathon-platform/backend/repositories"
	"hackathon-platform/backend/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CheckInController struct {
	service services.CheckInService
}

func NewCheckInController(db *gorm.DB) *CheckInController {
	checkInRepo := repositories.NewCheckInRepository(db)
	eventRepo := repositories.NewEventRepository(db)
	teamRepo := repositories.NewTeamRepository(db)
	service := services.NewCheckInService(checkInRepo, eventRepo, teamRepo)
	return &CheckInController{service: service}
}

// GenerateQRCode generates a QR code for check-in
func (c *CheckInController) GenerateQRCode(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	qrCode, err := c.service.GenerateQRCode(uint(eventID))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, qrCode)
}

// CheckIn handles check-in request with signature verification
func (c *CheckInController) CheckIn(ctx *gin.Context) {
	var req services.CheckInRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	// Get IP address from request
	if req.IPAddress == "" {
		req.IPAddress = ctx.ClientIP()
	}

	checkIn, err := c.service.VerifyAndCheckIn(&req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, checkIn)
}

// GetCheckIn retrieves a check-in by ID
func (c *CheckInController) GetCheckIn(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid check-in ID"})
		return
	}

	checkIn, err := c.service.GetCheckIn(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Check-in not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, checkIn)
}

// ListCheckInsByEvent retrieves all check-ins for an event
func (c *CheckInController) ListCheckInsByEvent(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	checkIns, err := c.service.GetCheckInsByEvent(uint(eventID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, checkIns)
}

// GetCheckInCount retrieves check-in count for an event
func (c *CheckInController) GetCheckInCount(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	count, err := c.service.GetCheckInCount(uint(eventID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"count": count})
}

// GetUserCheckIn retrieves check-in for a user and event
func (c *CheckInController) GetUserCheckIn(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	userAddress := ctx.Param("address")
	if userAddress == "" {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "User address is required"})
		return
	}

	checkIn, err := c.service.GetCheckInByUserAndEvent(userAddress, uint(eventID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Check-in not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, checkIn)
}

// UpdateTxHash updates the transaction hash for a check-in
func (c *CheckInController) UpdateTxHash(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid check-in ID"})
		return
	}

	var req struct {
		TxHash string `json:"tx_hash" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	checkIn, err := c.service.UpdateTxHash(uint(id), req.TxHash)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, checkIn)
}

// DeleteCheckIn deletes a check-in
func (c *CheckInController) DeleteCheckIn(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid check-in ID"})
		return
	}

	err = c.service.DeleteCheckIn(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Check-in not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Check-in deleted successfully"})
}

