package controllers

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// MessageResponse represents a success message response
type MessageResponse struct {
	Message string `json:"message"`
}

