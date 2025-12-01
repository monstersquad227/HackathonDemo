package main

import (
	_ "context"
	"encoding/json"
	"fmt"
	"log"
	_ "math/big"
	"net/http"
	"os"
	"sync"
	"time"

	_ "github.com/ethereum/go-ethereum"
	_ "github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gorilla/mux"
)

// ===== Models =====

type Activity struct {
	ID                  int       `json:"id"`
	Name                string    `json:"name"`
	Description         string    `json:"description"`
	StartTime           time.Time `json:"startTime"`
	EndTime             time.Time `json:"endTime"`
	MaxParticipants     int       `json:"maxParticipants"`
	CurrentParticipants int       `json:"currentParticipants"`
	NFTName             string    `json:"nftName"`
	NFTContractAddr     string    `json:"nftContractAddress"`
	Status              string    `json:"status"` // draft, ongoing, ended
	CreatedAt           time.Time `json:"createdAt"`
}

type Registration struct {
	ID               int       `json:"id"`
	ActivityID       int       `json:"activityId"`
	WalletAddress    string    `json:"walletAddress"`
	NFTTokenID       int64     `json:"nftTokenId"`
	UserName         string    `json:"userName"`
	Email            string    `json:"email"`
	Phone            string    `json:"phone"`
	RegistrationTime time.Time `json:"registrationTime"`
	NFTMintTxHash    string    `json:"nftMintTxHash"`
	Status           string    `json:"status"` // pending, minted, cancelled
	CreatedAt        time.Time `json:"createdAt"`
}

type CheckIn struct {
	ID                 int       `json:"id"`
	ActivityID         int       `json:"activityId"`
	WalletAddress      string    `json:"walletAddress"`
	NFTTokenID         int64     `json:"nftTokenId"`
	CheckInTime        time.Time `json:"checkInTime"`
	CheckInType        string    `json:"checkInType"`        // online, offline
	VerificationStatus string    `json:"verificationStatus"` // pending, verified, failed
	CreatedAt          time.Time `json:"createdAt"`
}

// ===== API Requests/Responses =====

type RegisterRequest struct {
	ActivityID    int    `json:"activityId"`
	WalletAddress string `json:"walletAddress"`
	UserName      string `json:"userName"`
	Email         string `json:"email"`
	Phone         string `json:"phone"`
}

type CheckInRequest struct {
	ActivityID    int    `json:"activityId"`
	WalletAddress string `json:"walletAddress"`
	NFTTokenID    int64  `json:"nftTokenId"`
}

type NFTVerifyRequest struct {
	ContractAddress string `json:"contractAddress"`
	TokenID         int64  `json:"tokenId"`
	OwnerAddress    string `json:"ownerAddress"`
}

// ===== Database (In-Memory) =====

type Database struct {
	sync.RWMutex
	activities     map[int]*Activity
	registrations  map[int]*Registration
	checkIns       map[int]*CheckIn
	nextActivityID int
	nextRegID      int
	nextCheckInID  int
}

var db *Database

// ===== Blockchain Service =====

type BlockchainService struct {
	client       *ethclient.Client
	contractAddr common.Address
	privateKey   string
}

var blockchainService *BlockchainService

// ===== Init Functions =====

func initDB() {
	db = &Database{
		activities:     make(map[int]*Activity),
		registrations:  make(map[int]*Registration),
		checkIns:       make(map[int]*CheckIn),
		nextActivityID: 1,
		nextRegID:      1,
		nextCheckInID:  1,
	}

	// Add sample data
	db.activities[1] = &Activity{
		ID:                  1,
		Name:                "Web3 Hackathon 2025",
		Description:         "Build the future of web3",
		StartTime:           time.Now(),
		EndTime:             time.Now().AddDate(0, 0, 2),
		MaxParticipants:     100,
		CurrentParticipants: 45,
		NFTName:             "Hacker Badge",
		NFTContractAddr:     "0x123456...",
		Status:              "ongoing",
		CreatedAt:           time.Now(),
	}
	db.nextActivityID = 2
}

func initBlockchain() {
	// Connect to Ethereum node (e.g., Infura, Alchemy)
	// For demo: client, _ := ethclient.Dial("https://mainnet.infura.io/v3/YOUR_API_KEY")

	blockchainService = &BlockchainService{
		client:       nil, // Set in production
		contractAddr: common.HexToAddress("0x..."),
		privateKey:   os.Getenv("PRIVATE_KEY"),
	}
}

// ===== Activity Handlers =====

func createActivity(w http.ResponseWriter, r *http.Request) {
	var activity Activity
	if err := json.NewDecoder(r.Body).Decode(&activity); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	db.Lock()
	activity.ID = db.nextActivityID
	activity.CreatedAt = time.Now()
	activity.Status = "draft"
	activity.CurrentParticipants = 0
	db.activities[activity.ID] = &activity
	db.nextActivityID++
	db.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(activity)
}

func getActivities(w http.ResponseWriter, r *http.Request) {
	db.RLock()
	activities := make([]*Activity, 0, len(db.activities))
	for _, a := range db.activities {
		activities = append(activities, a)
	}
	db.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(activities)
}

func getActivity(w http.ResponseWriter, r *http.Request) {
	id := 0
	fmt.Sscanf(mux.Vars(r)["id"], "%d", &id)

	db.RLock()
	activity, exists := db.activities[id]
	db.RUnlock()

	if !exists {
		http.Error(w, "Activity not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(activity)
}

// ===== Registration Handlers =====

func register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	db.Lock()
	activity, exists := db.activities[req.ActivityID]
	if !exists {
		db.Unlock()
		http.Error(w, "Activity not found", http.StatusNotFound)
		return
	}

	// Check if already registered
	for _, reg := range db.registrations {
		if reg.ActivityID == req.ActivityID && reg.WalletAddress == req.WalletAddress {
			db.Unlock()
			http.Error(w, "Already registered", http.StatusConflict)
			return
		}
	}

	// Check capacity
	if activity.CurrentParticipants >= activity.MaxParticipants {
		db.Unlock()
		http.Error(w, "Activity is full", http.StatusForbidden)
		return
	}

	// Mint NFT (async)
	tokenID := int64(time.Now().UnixNano() % 1000000)
	txHash := "0x" + fmt.Sprintf("%064x", time.Now().UnixNano())

	registration := &Registration{
		ID:               db.nextRegID,
		ActivityID:       req.ActivityID,
		WalletAddress:    req.WalletAddress,
		NFTTokenID:       tokenID,
		UserName:         req.UserName,
		Email:            req.Email,
		Phone:            req.Phone,
		RegistrationTime: time.Now(),
		NFTMintTxHash:    txHash,
		Status:           "minted",
		CreatedAt:        time.Now(),
	}

	db.registrations[registration.ID] = registration
	db.nextRegID++
	activity.CurrentParticipants++
	db.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(registration)

	log.Printf("Minted NFT #%d for %s on activity %d", tokenID, req.WalletAddress, req.ActivityID)
}

func getRegistrations(w http.ResponseWriter, r *http.Request) {
	activityID := 0
	if val := r.URL.Query().Get("activityId"); val != "" {
		fmt.Sscanf(val, "%d", &activityID)
	}

	db.RLock()
	registrations := make([]*Registration, 0)
	for _, reg := range db.registrations {
		if activityID == 0 || reg.ActivityID == activityID {
			registrations = append(registrations, reg)
		}
	}
	db.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(registrations)
}

// ===== Check-In Handlers =====

func checkIn(w http.ResponseWriter, r *http.Request) {
	var req CheckInRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	db.Lock()

	// Find registration
	var registration *Registration
	for _, reg := range db.registrations {
		if reg.ActivityID == req.ActivityID &&
			reg.WalletAddress == req.WalletAddress &&
			reg.NFTTokenID == req.NFTTokenID {
			registration = reg
			break
		}
	}

	if registration == nil {
		db.Unlock()
		http.Error(w, "Registration not found", http.StatusNotFound)
		return
	}

	// Check if already checked in today
	today := time.Now().Format("2006-01-02")
	for _, ci := range db.checkIns {
		if ci.ActivityID == req.ActivityID &&
			ci.WalletAddress == req.WalletAddress &&
			ci.CheckInTime.Format("2006-01-02") == today {
			db.Unlock()
			http.Error(w, "Already checked in today", http.StatusConflict)
			return
		}
	}

	// Verify NFT on blockchain (async)
	verified := verifyNFT(registration.NFTTokenID, req.WalletAddress)

	checkInRecord := &CheckIn{
		ID:                 db.nextCheckInID,
		ActivityID:         req.ActivityID,
		WalletAddress:      req.WalletAddress,
		NFTTokenID:         req.NFTTokenID,
		CheckInTime:        time.Now(),
		CheckInType:        "online",
		VerificationStatus: map[bool]string{true: "verified", false: "failed"}[verified],
		CreatedAt:          time.Now(),
	}

	db.checkIns[checkInRecord.ID] = checkInRecord
	db.nextCheckInID++
	db.Unlock()

	if !verified {
		http.Error(w, "NFT verification failed", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(checkInRecord)

	log.Printf("Check-in verified for %s on activity %d with NFT #%d", req.WalletAddress, req.ActivityID, req.NFTTokenID)
}

func verifyNFT(tokenID int64, ownerAddress string) bool {
	if blockchainService.client == nil {
		// Demo mode
		return true
	}

	// In production: call contract's balanceOf() or ownerOf()
	// Example:
	// caller := &bind.CallOpts{Context: context.Background()}
	// balance, err := contract.BalanceOf(caller, common.HexToAddress(ownerAddress))
	// return err == nil && balance.Cmp(big.NewInt(0)) > 0

	return true
}

func getCheckIns(w http.ResponseWriter, r *http.Request) {
	activityID := 0
	if val := r.URL.Query().Get("activityId"); val != "" {
		fmt.Sscanf(val, "%d", &activityID)
	}

	db.RLock()
	checkIns := make([]*CheckIn, 0)
	for _, ci := range db.checkIns {
		if activityID == 0 || ci.ActivityID == activityID {
			checkIns = append(checkIns, ci)
		}
	}
	db.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(checkIns)
}

func getCheckInStats(w http.ResponseWriter, r *http.Request) {
	id := 0
	fmt.Sscanf(mux.Vars(r)["id"], "%d", &id)

	db.RLock()
	activityCheckIns := make([]*CheckIn, 0)
	for _, ci := range db.checkIns {
		if ci.ActivityID == id {
			activityCheckIns = append(activityCheckIns, ci)
		}
	}
	db.RUnlock()

	stats := map[string]interface{}{
		"activityId":    id,
		"totalCheckIns": len(activityCheckIns),
		"verifiedCount": 0,
		"uniqueUsers":   make(map[string]bool),
	}

	for _, ci := range activityCheckIns {
		if ci.VerificationStatus == "verified" {
			stats["verifiedCount"] = stats["verifiedCount"].(int) + 1
		}
		stats["uniqueUsers"].(map[string]bool)[ci.WalletAddress] = true
	}
	stats["uniqueUsers"] = len(stats["uniqueUsers"].(map[string]bool))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// ===== Health & Middleware =====

func health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// ===== Main =====

func main() {
	initDB()
	initBlockchain()

	router := mux.NewRouter()

	// Activity endpoints
	router.HandleFunc("/api/activities", createActivity).Methods("POST")
	router.HandleFunc("/api/activities", getActivities).Methods("GET")
	router.HandleFunc("/api/activities/{id}", getActivity).Methods("GET")

	// Registration endpoints
	router.HandleFunc("/api/register", register).Methods("POST")
	router.HandleFunc("/api/registrations", getRegistrations).Methods("GET")

	// Check-in endpoints
	router.HandleFunc("/api/checkin", checkIn).Methods("POST")
	router.HandleFunc("/api/checkins", getCheckIns).Methods("GET")
	router.HandleFunc("/api/checkins/stats/{id}", getCheckInStats).Methods("GET")

	// Health check
	router.HandleFunc("/health", health).Methods("GET")

	port := ":8080"
	log.Printf("Server starting on %s", port)

	// 关键：在这里把整个 router 用 enableCORS 包起来
	log.Fatal(http.ListenAndServe(port, enableCORS(router)))
}
