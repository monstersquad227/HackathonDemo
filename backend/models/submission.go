package models

import (
	"time"

	"gorm.io/gorm"
)

// SubmissionStatus represents the status of a submission
type SubmissionStatus string

const (
	SubmissionStatusPending  SubmissionStatus = "pending"
	SubmissionStatusApproved SubmissionStatus = "approved"
	SubmissionStatusRejected SubmissionStatus = "rejected"
)

// Submission represents a project submission for an event
type Submission struct {
	ID              uint             `json:"id" gorm:"primaryKey"`
	EventID         uint             `json:"event_id" gorm:"not null;index"`
	TeamID          uint             `json:"team_id" gorm:"not null;index"`
	Title           string           `json:"title" gorm:"not null"`
	Description     string           `json:"description" gorm:"type:text"`
	GithubRepo      string           `json:"github_repo"`
	DemoURL         string           `json:"demo_url"`
	Documentation   string           `json:"documentation"`
	SubmissionHash  string           `json:"submission_hash"` // On-chain fingerprint / IPFS hash
	StorageURL      string           `json:"storage_url"`     // IPFS / Arweave URL
	Status          SubmissionStatus `json:"status" gorm:"type:varchar(20);default:'pending'"`
	ReviewerComment string           `json:"reviewer_comment" gorm:"type:text"`
	SubmittedBy     string           `json:"submitted_by" gorm:"not null"` // Wallet address
	SubmittedAt     time.Time        `json:"submitted_at" gorm:"not null"`
	UpdatedAt       time.Time        `json:"updated_at"`
	DeletedAt       gorm.DeletedAt   `json:"deleted_at" gorm:"index"`

	Files []SubmissionFile `json:"files" gorm:"foreignKey:SubmissionID"`
	Event Event            `json:"event" gorm:"foreignKey:EventID"`
	Team  Team             `json:"team" gorm:"foreignKey:TeamID"`
}

// SubmissionFile represents additional file references for a submission
type SubmissionFile struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	SubmissionID uint      `json:"submission_id" gorm:"not null;index"`
	FileName     string    `json:"file_name"`
	FileType     string    `json:"file_type"`
	URL          string    `json:"url"` // IPFS / external URL
	Hash         string    `json:"hash"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// TableName for Submission
func (Submission) TableName() string {
	return "submissions"
}

// TableName for SubmissionFile
func (SubmissionFile) TableName() string {
	return "submission_files"
}
