package controllers

import (
	"errors"
	"hackathon-platform/backend/models"
	"hackathon-platform/backend/repositories"
	"hackathon-platform/backend/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type EventController struct {
	service services.EventService
}

func NewEventController(db *gorm.DB) *EventController {
	repo := repositories.NewEventRepository(db)
	service := services.NewEventService(repo)
	return &EventController{service: service}
}

// CreateEvent creates a new hackathon event
// @Summary Create a new event
// @Description Create a new hackathon event with all required information
// @Tags events
// @Accept json
// @Produce json
// @Param event body services.CreateEventRequest true "Event data"
// @Success 201 {object} models.Event
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/events [post]
func (c *EventController) CreateEvent(ctx *gin.Context) {
	var req services.CreateEventRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	event, err := c.service.CreateEvent(&req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, event)
}

// ListEvents retrieves all events
// @Summary List all events
// @Description Get a list of all hackathon events
// @Tags events
// @Produce json
// @Success 200 {array} models.Event
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/events [get]
func (c *EventController) ListEvents(ctx *gin.Context) {
	events, err := c.service.ListEvents()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, events)
}

// GetEvent retrieves a single event by ID
// @Summary Get event by ID
// @Description Get detailed information about a specific event
// @Tags events
// @Produce json
// @Param eventId path int true "Event ID"
// @Success 200 {object} models.Event
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/events/{eventId} [get]
func (c *EventController) GetEvent(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	event, err := c.service.GetEvent(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Event not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, event)
}

// UpdateEvent updates an existing event
// @Summary Update an event
// @Description Update information about an existing event
// @Tags events
// @Accept json
// @Produce json
// @Param eventId path int true "Event ID"
// @Param event body services.UpdateEventRequest true "Updated event data"
// @Success 200 {object} models.Event
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/events/{eventId} [put]
func (c *EventController) UpdateEvent(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	var req services.UpdateEventRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	event, err := c.service.UpdateEvent(uint(id), &req)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Event not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, event)
}

// DeleteEvent deletes an event
// @Summary Delete an event
// @Description Delete an event by ID
// @Tags events
// @Produce json
// @Param eventId path int true "Event ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/events/{eventId} [delete]
func (c *EventController) DeleteEvent(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	err = c.service.DeleteEvent(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Event not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
}

// UpdateStage updates the current stage of an event
// @Summary Update event stage
// @Description Update the current stage of an event (registration, checkin, submission, voting, awards, ended)
// @Tags events
// @Accept json
// @Produce json
// @Param eventId path int true "Event ID"
// @Param stage body object{stage=string} true "New stage"
// @Success 200 {object} models.Event
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /api/v1/events/{eventId}/stage [patch]
func (c *EventController) UpdateStage(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	var req struct {
		Stage models.EventStage `json:"stage" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	event, err := c.service.UpdateStage(uint(id), req.Stage)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Event not found"})
			return
		}
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, event)
}

