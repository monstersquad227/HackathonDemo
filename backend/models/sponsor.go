package models

import (
	"time"

	"gorm.io/gorm"
)

// AssetType represents the type of sponsored asset
type AssetType string

const (
	AssetTypeERC20  AssetType = "erc20"  // ERC20 token
	AssetTypeNative AssetType = "native" // Native asset (ETH, SOL, etc.)
	AssetTypeNFT    AssetType = "nft"    // NFT
)

// SponsorshipStatus represents the status of a sponsorship
type SponsorshipStatus string

const (
	SponsorshipStatusPending   SponsorshipStatus = "pending"   // Pending approval
	SponsorshipStatusApproved  SponsorshipStatus = "approved"  // Approved by organizer
	SponsorshipStatusRejected  SponsorshipStatus = "rejected"  // Rejected by organizer
	SponsorshipStatusDeposited SponsorshipStatus = "deposited" // Funds deposited to contract
)

// Sponsor represents a sponsor
type Sponsor struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"not null"`
	Description string         `json:"description" gorm:"type:text"`
	LogoURL     string         `json:"logo_url"`
	WebsiteURL  string         `json:"website_url"`
	Address     string         `json:"address" gorm:"not null;uniqueIndex"` // Wallet address
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// Sponsorship represents a sponsorship for an event
type Sponsorship struct {
	ID              uint              `json:"id" gorm:"primaryKey"`
	EventID         uint              `json:"event_id" gorm:"not null;index"`
	SponsorID       uint              `json:"sponsor_id" gorm:"not null;index"`
	AssetType       AssetType         `json:"asset_type" gorm:"type:varchar(20);not null"`
	TokenAddress    string            `json:"token_address"`          // ERC20 token address, or NFT contract address
	TokenID         string            `json:"token_id"`               // NFT token ID (if NFT)
	Amount          string            `json:"amount" gorm:"not null"` // Amount in wei/smallest unit
	AmountDisplay   string            `json:"amount_display"`         // Human-readable amount
	Status          SponsorshipStatus `json:"status" gorm:"type:varchar(20);default:'pending'"`
	DepositTxHash   string            `json:"deposit_tx_hash"` // Transaction hash when deposited
	VotingWeight    string            `json:"voting_weight"`   // Voting weight (e.g., "1 USDC = 1 vote")
	VotingPower     float64           `json:"voting_power" gorm:"type:numeric(24,6);default:0"`
	Benefits        string            `json:"benefits" gorm:"type:text"` // Sponsorship benefits description
	ContractAddress string            `json:"contract_address"`          // Prize pool contract address
	CreatedAt       time.Time         `json:"created_at"`
	UpdatedAt       time.Time         `json:"updated_at"`
	DeletedAt       gorm.DeletedAt    `json:"deleted_at" gorm:"index"`

	// Relations
	Event   Event   `json:"event" gorm:"foreignKey:EventID"`
	Sponsor Sponsor `json:"sponsor" gorm:"foreignKey:SponsorID"`
}

// FundingPool represents a funding pool for an event
type FundingPool struct {
	ID              uint           `json:"id" gorm:"primaryKey"`
	EventID         uint           `json:"event_id" gorm:"not null;uniqueIndex"`
	ContractAddress string         `json:"contract_address" gorm:"not null"` // On-chain contract address
	TotalAmount     string         `json:"total_amount"`                     // Total amount in pool (in wei)
	LockedUntil     *time.Time     `json:"locked_until"`                     // Locked until event ends
	Distributed     bool           `json:"distributed" gorm:"default:false"` // Whether prizes have been distributed
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relations
	Event        Event         `json:"event" gorm:"foreignKey:EventID"`
	Sponsorships []Sponsorship `json:"sponsorships" gorm:"foreignKey:EventID"`
}

// PrizeDistribution represents prize distribution configuration
type PrizeDistribution struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	EventID    uint      `json:"event_id" gorm:"not null;index"`
	Rank       int       `json:"rank" gorm:"not null"`               // 1 = 1st place
	Percentage int       `json:"percentage" gorm:"not null"`         // Percentage of total pool (e.g., 50 for 50%)
	AssetType  AssetType `json:"asset_type" gorm:"type:varchar(20)"` // Which asset type to distribute
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// TableName specifies the table name for Sponsor
func (Sponsor) TableName() string {
	return "sponsors"
}

// TableName specifies the table name for Sponsorship
func (Sponsorship) TableName() string {
	return "sponsorships"
}

// TableName specifies the table name for FundingPool
func (FundingPool) TableName() string {
	return "funding_pools"
}

// TableName specifies the table name for PrizeDistribution
func (PrizeDistribution) TableName() string {
	return "prize_distributions"
}
