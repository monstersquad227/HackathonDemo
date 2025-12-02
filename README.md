# ✅ 1. Platform Role Design
### 1. Organizer
* Publish Hackathon
* Review sponsors
* Manage event flow
* Review participating teams
* Start/End stages (Registration/Check-in/Voting)
* Prize pool management and distribution
### 2. Sponsor
* Create sponsorship details (prizes, tokens, NFTs, gifts)
* Deposit funds into the prize pool
* Gain sponsorship benefits (display, logo, voting rights, etc.)
* Real-time event data tracking
### 3. Participant
* Create/Join a team
* Register for events
* On-site check-in (on-chain or off-chain signature)
* Submit projects (code links, demo, documentation)
* Participate in voting (if allowed by the organizer)

# ✅ 2. System Module Breakdown (Core Modules)
Below are the complete module functionalities your platform should include.
---
# **📦 1. Event Management Module**
### Organizer Features
* Create new Hackathon (on-chain/off-chain)
  * Event name, location, time
  * Competition stages (Registration → Check-in → Submission → Voting → Awards)
  * Prize configuration (1st/2nd/3rd place, etc.)
  * Allow sponsor voting, allow public voting
---
# **📦 2. Sponsor & Funding Pool Module**
### Sponsor Features
* Initiate sponsorship (supports multiple forms)
  * ERC20 tokens
  * Native assets (ETH/SOL, etc.)
  * NFTs (prizes)
* Deposit funds into the prize pool contract
### Funding Pool Features
* Multi-currency custody (ERC20 / SOL / Native assets)
* Reward ratio configuration
* Lock until event ends
* Automatic prize distribution (smart contract)
---
# **📦 3. Registration & Team Management**
### Participant Features
* Connect wallet login
* Create/Join a team
* Fill team details (member list, skills)
* Register for events
* Sign registration SBT (non-transferable)
### Organizer Features
* Approve/Reject teams
* Manage team size
* View team details
---
# **📦 4. Check-in System**
### Off-chain Signature Verification (Recommended)
* User scans QR code → Initiates signature → Backend verification → On-chain check-in record
* Low cost, high security
### Organizer Features
* View check-in count
* Export check-in records
* Prevent duplicate check-ins
---
# **📦 5. Submission System**
### Participant Features
* Submit project details
  * GitHub Repo
  * Demo video
  * Project documentation
* Upload attachments (off-chain storage, e.g., IPFS/Arweave)
### On-chain
* Project fingerprint (Hash)
* Timestamp proof (immutable)
### Organizer Features
* Manage submissions
* Mark projects as approved/rejected
---
# **📦 6. Voting System**
Three voting dimensions:
### ① Judge Voting (Standard)
* Whitelist addresses
* One person one vote or weighted votes
### ② Sponsor Voting
* Weight based on sponsorship amount
* Example: 1 USDC = 1 vote (configurable)
### ③ Public Voting (Optional)
* Limit votes per address
* Anti-spam mechanism
* Voting requires holding event NFT (prevent fake users)
### Voting Methods
* On-chain voting (transparent)
* Off-chain signature → Batch on-chain (save Gas)
---
# **📦 7. Judging & Results Module**
* Automatically calculate rankings based on votes
* Announce results (on-chain record)
* Judge evaluation system (text, ratings)
* On-chain proof (Result SBT)
---
# **📦 8. Payout System**
**Core: Automated prize distribution (most important)**
Prize pool contract supports:
* Multi-currency distribution
* Automatic proportional distribution to team leader or entire team
* Organizer triggers payout (avoid auto-trigger security risks)
* Prevent duplicate payouts
---
# 🎨 9. Frontend Module (UI/UX)
* Homepage event display
* Event details page (timeline + prize pool display)
* Registration page
* Voting page
* Results page (leaderboard)
* User center (participation records, certificates)
* Sponsor dashboard
* Organizer dashboard
* All dashboards unified under one website, differentiated by roles
---
# 🛠️ Tech Stack
## Frontend
- **Framework**: React
- **Web3 Interaction**: Web3.js or Ethers.js
## Backend
- **Language**: Go (optional, some features can be implemented via smart contracts)
## Smart Contracts
- **Language**: Solidity
- **Deployment Chains**: Ethereum, Polygon, etc.
## Storage
- **Distributed Storage**: IPFS (for storing project code and demo files)
## Authentication
- **Wallet Integration**: MetaMask or other Web3 wallets