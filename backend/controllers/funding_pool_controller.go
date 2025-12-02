package controllers

import (
	"errors"
	"hackathon-platform/backend/repositories"
	"hackathon-platform/backend/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FundingPoolController struct {
	service services.FundingPoolService
}

func NewFundingPoolController(db *gorm.DB) *FundingPoolController {
	poolRepo := repositories.NewFundingPoolRepository(db)
	eventRepo := repositories.NewEventRepository(db)
	distRepo := repositories.NewPrizeDistributionRepository(db)
	service := services.NewFundingPoolService(poolRepo, eventRepo, distRepo)
	return &FundingPoolController{service: service}
}

// CreateFundingPool creates a new funding pool for an event
func (c *FundingPoolController) CreateFundingPool(ctx *gin.Context) {
	var req struct {
		EventID         uint   `json:"event_id" binding:"required"`
		ContractAddress string `json:"contract_address" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	pool, err := c.service.CreateFundingPool(req.EventID, req.ContractAddress)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, pool)
}

// GetFundingPool retrieves a funding pool by ID
func (c *FundingPoolController) GetFundingPool(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid pool ID"})
		return
	}

	pool, err := c.service.GetFundingPool(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Funding pool not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, pool)
}

// GetFundingPoolByEvent retrieves funding pool by event ID
func (c *FundingPoolController) GetFundingPoolByEvent(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	pool, err := c.service.GetFundingPoolByEvent(uint(eventID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Funding pool not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, pool)
}

// ListFundingPools retrieves all funding pools
func (c *FundingPoolController) ListFundingPools(ctx *gin.Context) {
	pools, err := c.service.ListFundingPools()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, pools)
}

// UpdateFundingPool updates a funding pool
func (c *FundingPoolController) UpdateFundingPool(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid pool ID"})
		return
	}

	var req services.UpdateFundingPoolRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	pool, err := c.service.UpdateFundingPool(uint(id), &req)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Funding pool not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, pool)
}

// SetLockedUntil sets the lock time for a funding pool
func (c *FundingPoolController) SetLockedUntil(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	var req struct {
		LockedUntil time.Time `json:"locked_until" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	pool, err := c.service.SetLockedUntil(uint(eventID), req.LockedUntil)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, pool)
}

// MarkAsDistributed marks a funding pool as distributed
func (c *FundingPoolController) MarkAsDistributed(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	pool, err := c.service.MarkAsDistributed(uint(eventID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, pool)
}

