package models

import (
	"time"

	"gorm.io/gorm"
)

// TeamStatus represents the status of a team
type TeamStatus string

const (
	TeamStatusPending  TeamStatus = "pending"  // Pending organizer approval
	TeamStatusApproved TeamStatus = "approved" // Approved by organizer
	TeamStatusRejected TeamStatus = "rejected" // Rejected by organizer
)

// Team represents a team
type Team struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	Name        string     `json:"name" gorm:"not null"`
	Description string     `json:"description" gorm:"type:text"`
	LeaderID    uint       `json:"leader_id" gorm:"not null"` // User ID of team leader
	LeaderAddress string   `json:"leader_address" gorm:"type:varchar(255);not null"` // Wallet address of team leader
	MaxMembers  int        `json:"max_members" gorm:"default:5"` // Maximum team size
	Status      TeamStatus `json:"status" gorm:"type:varchar(20);default:'pending'"`
	Skills      string     `json:"skills" gorm:"type:text"` // Comma-separated skills
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
	
	// Relations
	Members      []TeamMember `json:"members" gorm:"foreignKey:TeamID"`
	Registrations []Registration `json:"registrations" gorm:"foreignKey:TeamID"`
}

// TeamMember represents a team member
type TeamMember struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	TeamID    uint      `json:"team_id" gorm:"not null;index"`
	UserID    uint      `json:"user_id"` // Optional: if you have user system
	Address   string    `json:"address" gorm:"type:varchar(255);not null"` // Wallet address
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Skills    string    `json:"skills" gorm:"type:text"` // Comma-separated skills
	Role      string    `json:"role"` // e.g., "Developer", "Designer", "PM"
	JoinedAt  *time.Time `json:"joined_at"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	
	// Relations
	Team Team `json:"team" gorm:"foreignKey:TeamID"`
}

// BeforeCreate hook to set JoinedAt if not set
func (tm *TeamMember) BeforeCreate(tx *gorm.DB) error {
	if tm.JoinedAt == nil {
		now := time.Now()
		tm.JoinedAt = &now
	}
	return nil
}

// RegistrationStatus represents the status of a registration
type RegistrationStatus string

const (
	RegistrationStatusPending  RegistrationStatus = "pending"  // Pending organizer approval
	RegistrationStatusApproved RegistrationStatus = "approved"   // Approved by organizer
	RegistrationStatusRejected RegistrationStatus = "rejected"   // Rejected by organizer
	RegistrationStatusSBTMinted RegistrationStatus = "sbt_minted" // SBT has been minted
)

// Registration represents a team registration for an event
type Registration struct {
	ID              uint              `json:"id" gorm:"primaryKey"`
	EventID         uint              `json:"event_id" gorm:"not null;index"`
	TeamID          *uint             `json:"team_id" gorm:"index"` // Optional: can be null for individual registration
	WalletAddress   string            `json:"wallet_address" gorm:"type:varchar(255);index"` // Wallet address for individual registration
	Status          RegistrationStatus `json:"status" gorm:"type:varchar(20);default:'pending'"`
	ProjectName     string            `json:"project_name"` // Optional: project name if known
	ProjectDescription string         `json:"project_description" gorm:"type:text"`
	SBTTokenID      *uint64           `json:"sbt_token_id"` // SBT token ID if minted
	SBTTxHash       string            `json:"sbt_tx_hash"` // Transaction hash when SBT was minted
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
	DeletedAt       gorm.DeletedAt   `json:"deleted_at" gorm:"index"`
	
	// Relations
	Event Event `json:"event" gorm:"foreignKey:EventID"`
	Team  *Team `json:"team" gorm:"foreignKey:TeamID"`
}

// TableName specifies the table name for Team
func (Team) TableName() string {
	return "teams"
}

// TableName specifies the table name for TeamMember
func (TeamMember) TableName() string {
	return "team_members"
}

// TableName specifies the table name for Registration
func (Registration) TableName() string {
	return "registrations"
}

