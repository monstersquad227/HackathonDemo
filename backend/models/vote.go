package models

import (
	"time"
)

// VoterType represents the type of voter that is allowed to cast a vote.
type VoterType string

const (
	VoterTypeJudge   VoterType = "judge"
	VoterTypeSponsor VoterType = "sponsor"
	VoterTypePublic  VoterType = "public"
)

// Vote represents a single vote that was cast for a submission.
type Vote struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	EventID       uint      `json:"event_id" gorm:"not null;index;uniqueIndex:idx_vote_submission_voter"`
	SubmissionID  uint      `json:"submission_id" gorm:"not null;index;uniqueIndex:idx_vote_submission_voter"`
	VoterAddress  string    `json:"voter_address" gorm:"size:100;not null;index;uniqueIndex:idx_vote_submission_voter"`
	VoterType     VoterType `json:"voter_type" gorm:"type:varchar(20);not null;uniqueIndex:idx_vote_submission_voter"`
	Weight        float64   `json:"weight" gorm:"type:numeric(24,6);default:1"`
	Reason        string    `json:"reason" gorm:"type:text"`
	Signature     string    `json:"signature"`
	OffchainProof string    `json:"offchain_proof"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	Submission Submission `json:"submission" gorm:"foreignKey:SubmissionID"`
}

// TableName overrides the table name for Vote.
func (Vote) TableName() string {
	return "votes"
}
