// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CheckIn
 * @dev Smart contract for recording check-ins on-chain
 */
contract CheckIn is Ownable {
    constructor() Ownable(msg.sender) {}
    
    // Check-in structure
    struct CheckInRecord {
        uint256 eventId;
        address user;
        uint256 timestamp;
        bool exists;
    }

    // Mapping from event ID to check-in records
    mapping(uint256 => mapping(address => CheckInRecord)) public checkIns;
    
    // Mapping from event ID to check-in count
    mapping(uint256 => uint256) public eventCheckInCounts;
    
    // Array of check-in records per event
    mapping(uint256 => address[]) public eventCheckInUsers;
    
    // Events
    event CheckedIn(
        uint256 indexed eventId,
        address indexed user,
        uint256 timestamp
    );
    
    /**
     * @dev Record a check-in (only callable by owner)
     * @param eventId Event ID
     * @param user User address
     */
    function recordCheckIn(uint256 eventId, address user) public onlyOwner {
        require(user != address(0), "Invalid user address");
        require(!checkIns[eventId][user].exists, "Already checked in");
        
        checkIns[eventId][user] = CheckInRecord({
            eventId: eventId,
            user: user,
            timestamp: block.timestamp,
            exists: true
        });
        
        eventCheckInCounts[eventId]++;
        eventCheckInUsers[eventId].push(user);
        
        emit CheckedIn(eventId, user, block.timestamp);
    }
    
    /**
     * @dev Batch record check-ins (only callable by owner)
     * @param eventId Event ID
     * @param users Array of user addresses
     */
    function batchRecordCheckIn(uint256 eventId, address[] memory users) public onlyOwner {
        require(users.length <= 100, "Batch too large");
        for (uint256 i = 0; i < users.length; i++) {
            if (!checkIns[eventId][users[i]].exists) {
                recordCheckIn(eventId, users[i]);
            }
        }
    }
    
    /**
     * @dev Check if user has checked in for an event
     * @param eventId Event ID
     * @param user User address
     */
    function hasCheckedIn(uint256 eventId, address user) public view returns (bool) {
        return checkIns[eventId][user].exists;
    }
    
    /**
     * @dev Get check-in record for a user and event
     * @param eventId Event ID
     * @param user User address
     */
    function getCheckIn(uint256 eventId, address user) public view returns (CheckInRecord memory) {
        require(checkIns[eventId][user].exists, "Check-in not found");
        return checkIns[eventId][user];
    }
    
    /**
     * @dev Get check-in count for an event
     * @param eventId Event ID
     */
    function getCheckInCount(uint256 eventId) public view returns (uint256) {
        return eventCheckInCounts[eventId];
    }
    
    /**
     * @dev Get all users who checked in for an event
     * @param eventId Event ID
     */
    function getEventCheckInUsers(uint256 eventId) public view returns (address[] memory) {
        return eventCheckInUsers[eventId];
    }
}

