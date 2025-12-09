// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EventManagement
 * @dev Smart contract for managing hackathon events on-chain
 */
contract EventManagement {
    // Custom errors for gas optimization
    error InvalidTimeRange();
    error EmptyEventName();
    error InvalidTimeSequence();
    error StringTooLong();
    error EventNotFound();
    error Unauthorized();
    error InvalidPrizeCount();

    // Constants
    uint256 public constant MAX_STRING_LENGTH = 500; // Maximum length for string fields
    uint256 public constant MAX_PRIZES = 50; // Maximum number of prizes per event

    // Event stage enumeration
    enum EventStage {
        Registration,
        CheckIn,
        Submission,
        Voting,
        Awards,
        Ended
    }

    // Event structure
    struct Event {
        uint256 id;
        string name;
        string description;
        string location;
        uint256 startTime;
        uint256 endTime;
        uint256 registrationStartTime;
        uint256 registrationEndTime;
        uint256 checkInStartTime;
        uint256 checkInEndTime;
        uint256 submissionStartTime;
        uint256 submissionEndTime;
        uint256 votingStartTime;
        uint256 votingEndTime;
        EventStage currentStage;
        address organizer;
        bool allowSponsorVoting;
        bool allowPublicVoting;
        bool exists;
    }

    // Prize structure
    struct Prize {
        uint256 rank;
        string name;
        string description;
        string amount;
    }

    // Mapping from event ID to Event
    mapping(uint256 => Event) public events;
    
    // Mapping from event ID to prizes
    mapping(uint256 => Prize[]) public eventPrizes;
    
    // Event counter
    uint256 public eventCounter;
    
    // Events
    event EventCreated(
        uint256 indexed eventId,
        string name,
        address indexed organizer,
        uint256 startTime,
        uint256 endTime
    );
    
    event EventStageUpdated(
        uint256 indexed eventId,
        EventStage oldStage,
        EventStage newStage
    );
    
    event EventUpdated(
        uint256 indexed eventId,
        string name
    );

    /**
     * @dev Create a new hackathon event
     * @param _name Event name
     * @param _description Event description
     * @param _location Event location
     * @param _startTime Event start timestamp
     * @param _endTime Event end timestamp
     * @param _registrationStartTime Registration start timestamp
     * @param _registrationEndTime Registration end timestamp
     * @param _checkInStartTime Check-in start timestamp
     * @param _checkInEndTime Check-in end timestamp
     * @param _submissionStartTime Submission start timestamp
     * @param _submissionEndTime Submission end timestamp
     * @param _votingStartTime Voting start timestamp
     * @param _votingEndTime Voting end timestamp
     * @param _allowSponsorVoting Whether to allow sponsor voting
     * @param _allowPublicVoting Whether to allow public voting
     * @param _prizes Array of prize configurations
     */
    function createEvent(
        string memory _name,
        string memory _description,
        string memory _location,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _registrationStartTime,
        uint256 _registrationEndTime,
        uint256 _checkInStartTime,
        uint256 _checkInEndTime,
        uint256 _submissionStartTime,
        uint256 _submissionEndTime,
        uint256 _votingStartTime,
        uint256 _votingEndTime,
        bool _allowSponsorVoting,
        bool _allowPublicVoting,
        Prize[] memory _prizes
    ) public returns (uint256) {
        // Validate event name
        if (bytes(_name).length == 0) {
            revert EmptyEventName();
        }
        if (bytes(_name).length > MAX_STRING_LENGTH) {
            revert StringTooLong();
        }

        // Validate time ranges
        if (_endTime <= _startTime) {
            revert InvalidTimeRange();
        }

        // Validate string lengths
        if (bytes(_description).length > MAX_STRING_LENGTH || 
            bytes(_location).length > MAX_STRING_LENGTH) {
            revert StringTooLong();
        }

        // Validate time sequence: all stage times should be within event time range
        if (_registrationStartTime < _startTime || 
            _registrationEndTime > _endTime ||
            _checkInStartTime < _startTime || 
            _checkInEndTime > _endTime ||
            _submissionStartTime < _startTime || 
            _submissionEndTime > _endTime ||
            _votingStartTime < _startTime || 
            _votingEndTime > _endTime) {
            revert InvalidTimeSequence();
        }

        // Validate stage time order
        if (_registrationEndTime <= _registrationStartTime ||
            _checkInEndTime <= _checkInStartTime ||
            _submissionEndTime <= _submissionStartTime ||
            _votingEndTime <= _votingStartTime) {
            revert InvalidTimeSequence();
        }

        // Validate prizes
        if (_prizes.length > MAX_PRIZES) {
            revert InvalidPrizeCount();
        }

        // Validate prize data
        for (uint256 i = 0; i < _prizes.length; i++) {
            if (bytes(_prizes[i].name).length == 0) {
                revert EmptyEventName();
            }
            if (bytes(_prizes[i].name).length > MAX_STRING_LENGTH ||
                bytes(_prizes[i].description).length > MAX_STRING_LENGTH ||
                bytes(_prizes[i].amount).length > MAX_STRING_LENGTH) {
                revert StringTooLong();
            }
        }

        eventCounter++;
        uint256 eventId = eventCounter;

        events[eventId] = Event({
            id: eventId,
            name: _name,
            description: _description,
            location: _location,
            startTime: _startTime,
            endTime: _endTime,
            registrationStartTime: _registrationStartTime,
            registrationEndTime: _registrationEndTime,
            checkInStartTime: _checkInStartTime,
            checkInEndTime: _checkInEndTime,
            submissionStartTime: _submissionStartTime,
            submissionEndTime: _submissionEndTime,
            votingStartTime: _votingStartTime,
            votingEndTime: _votingEndTime,
            currentStage: EventStage.Registration,
            organizer: msg.sender,
            allowSponsorVoting: _allowSponsorVoting,
            allowPublicVoting: _allowPublicVoting,
            exists: true
        });

        // Add prizes
        for (uint256 i = 0; i < _prizes.length; i++) {
            eventPrizes[eventId].push(_prizes[i]);
        }

        emit EventCreated(eventId, _name, msg.sender, _startTime, _endTime);
        return eventId;
    }

    /**
     * @dev Get event details
     * @param _eventId Event ID
     */
    function getEvent(uint256 _eventId) public view returns (Event memory) {
        if (!events[_eventId].exists) {
            revert EventNotFound();
        }
        return events[_eventId];
    }

    /**
     * @dev Get prizes for an event
     * @param _eventId Event ID
     */
    function getEventPrizes(uint256 _eventId) public view returns (Prize[] memory) {
        if (!events[_eventId].exists) {
            revert EventNotFound();
        }
        return eventPrizes[_eventId];
    }

    /**
     * @dev Update event stage (only organizer)
     * @param _eventId Event ID
     * @param _newStage New stage
     */
    function updateStage(uint256 _eventId, EventStage _newStage) public {
        if (!events[_eventId].exists) {
            revert EventNotFound();
        }
        if (events[_eventId].organizer != msg.sender) {
            revert Unauthorized();
        }
        
        EventStage oldStage = events[_eventId].currentStage;
        events[_eventId].currentStage = _newStage;
        
        emit EventStageUpdated(_eventId, oldStage, _newStage);
    }

    /**
     * @dev Update event information (only organizer)
     * @param _eventId Event ID
     * @param _name New name
     * @param _description New description
     * @param _location New location
     */
    function updateEvent(
        uint256 _eventId,
        string memory _name,
        string memory _description,
        string memory _location
    ) public {
        if (!events[_eventId].exists) {
            revert EventNotFound();
        }
        if (events[_eventId].organizer != msg.sender) {
            revert Unauthorized();
        }

        // Validate inputs
        if (bytes(_name).length == 0) {
            revert EmptyEventName();
        }
        if (bytes(_name).length > MAX_STRING_LENGTH ||
            bytes(_description).length > MAX_STRING_LENGTH ||
            bytes(_location).length > MAX_STRING_LENGTH) {
            revert StringTooLong();
        }
        
        events[_eventId].name = _name;
        events[_eventId].description = _description;
        events[_eventId].location = _location;
        
        emit EventUpdated(_eventId, _name);
    }

    /**
     * @dev Get total number of events
     */
    function getEventCount() public view returns (uint256) {
        return eventCounter;
    }

    /**
     * @dev Check if event exists
     * @param _eventId Event ID
     */
    function eventExists(uint256 _eventId) public view returns (bool) {
        return events[_eventId].exists;
    }
}

