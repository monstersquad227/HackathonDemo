package models

import "time"

// EventJudge stores judge whitelist information for a specific event.
type EventJudge struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	EventID   uint      `json:"event_id" gorm:"not null;index;uniqueIndex:idx_event_judge_address"`
	Address   string    `json:"address" gorm:"size:100;not null;uniqueIndex:idx_event_judge_address"`
	Weight    float64   `json:"weight" gorm:"type:numeric(24,6);default:1"`
	MaxVotes  uint      `json:"max_votes" gorm:"default:100"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName overrides the table name for EventJudge.
func (EventJudge) TableName() string {
	return "event_judges"
}
