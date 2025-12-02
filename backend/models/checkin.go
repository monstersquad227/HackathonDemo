package models

import (
	"time"

	"gorm.io/gorm"
)

// CheckIn represents a check-in record
type CheckIn struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	EventID         uint      `json:"event_id" gorm:"not null;index"`
	UserAddress     string    `json:"user_address" gorm:"type:varchar(255);not null;index"`
	TeamID          *uint     `json:"team_id"` // Optional: if user is part of a team
	Signature       string    `json:"signature" gorm:"not null"` // Signature for verification
	Message         string    `json:"message" gorm:"type:text"` // Signed message
	TxHash          string    `json:"tx_hash"` // On-chain transaction hash (if recorded)
	CheckInTime     time.Time `json:"check_in_time" gorm:"not null"`
	IPAddress       string    `json:"ip_address" gorm:"type:varchar(255)"` // IP address for security
	DeviceInfo      string    `json:"device_info"` // Device information
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"deleted_at" gorm:"index"`
	
	// Relations
	Event Event `json:"event" gorm:"foreignKey:EventID"`
	Team  *Team `json:"team" gorm:"foreignKey:TeamID"`
}

// CheckInQRCode represents a QR code for check-in
type CheckInQRCode struct {
	EventID     uint      `json:"event_id"`
	Secret      string    `json:"secret"` // Secret for signing
	Message      string    `json:"message"` // Message to sign
	ExpiresAt    time.Time `json:"expires_at"`
	CreatedAt    time.Time `json:"created_at"`
}

// TableName specifies the table name for CheckIn
func (CheckIn) TableName() string {
	return "check_ins"
}

