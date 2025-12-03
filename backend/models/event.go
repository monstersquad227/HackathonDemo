package models

import (
	"time"

	"gorm.io/gorm"
)

// EventStage represents the different stages of a hackathon event
type EventStage string

const (
	StageRegistration EventStage = "registration"
	StageCheckIn      EventStage = "checkin"
	StageSubmission   EventStage = "submission"
	StageVoting       EventStage = "voting"
	StageAwards       EventStage = "awards"
	StageEnded        EventStage = "ended"
)

// Prize represents a prize configuration for an event
type Prize struct {
	ID          uint   `json:"id" gorm:"primaryKey"`
	EventID     uint   `json:"event_id" gorm:"not null"`
	Rank        int    `json:"rank" gorm:"not null"` // 1 = 1st place, 2 = 2nd place, etc.
	Name        string `json:"name" gorm:"not null"` // e.g., "一等奖", "First Place"
	Description string `json:"description"`
	Amount      string `json:"amount"` // Prize amount (can be in tokens, ETH, etc.)
	Count       int    `json:"count" gorm:"default:1"` // Number of prizes for this rank
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// Event represents a hackathon event
type Event struct {
	ID                    uint       `json:"id" gorm:"primaryKey"`
	Name                  string     `json:"name" gorm:"not null"`
	Description           string     `json:"description" gorm:"type:text"`
	Location              string     `json:"location"`
	StartTime             time.Time  `json:"start_time" gorm:"not null"`
	EndTime               time.Time  `json:"end_time" gorm:"not null"`
	RegistrationStartTime *time.Time `json:"registration_start_time"`
	RegistrationEndTime   *time.Time `json:"registration_end_time"`
	CheckInStartTime      *time.Time `json:"checkin_start_time"`
	CheckInEndTime        *time.Time `json:"checkin_end_time"`
	SubmissionStartTime   *time.Time `json:"submission_start_time"`
	SubmissionEndTime     *time.Time `json:"submission_end_time"`
	VotingStartTime       *time.Time `json:"voting_start_time"`
	VotingEndTime         *time.Time `json:"voting_end_time"`
	CurrentStage          EventStage `json:"current_stage" gorm:"type:varchar(50);default:'registration'"`
	OrganizerAddress      string     `json:"organizer_address" gorm:"type:varchar(255);not null"` // Wallet address of organizer
	MaxParticipants        int        `json:"max_participants" gorm:"not null"` // Maximum number of participants
	AllowSponsorVoting    bool       `json:"allow_sponsor_voting" gorm:"default:false"`
	AllowPublicVoting     bool       `json:"allow_public_voting" gorm:"default:false"`
	ContractAddress       string     `json:"contract_address" gorm:"type:varchar(255)"` // On-chain contract address
	OnChain               bool       `json:"on_chain" gorm:"default:false"` // Whether event is on-chain
	Prizes                []Prize    `json:"prizes" gorm:"foreignKey:EventID"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
	DeletedAt             gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TableName specifies the table name for Event
func (Event) TableName() string {
	return "events"
}

// TableName specifies the table name for Prize
func (Prize) TableName() string {
	return "prizes"
}

