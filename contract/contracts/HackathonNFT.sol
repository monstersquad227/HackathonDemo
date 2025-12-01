// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HackathonNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter = 1;
    uint256 public activityCount = 0;

    struct ActivityMetadata {
        string name;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 maxParticipants;
        address creator;
        string imageURI;
        bool active;
    }

    struct NFTMetadata {
        uint256 activityId;
        address participant;
        uint256 registrationTime;
        string userName;
        uint256 checkInCount;
    }

    struct CheckInRecord {
        address participant;
        uint256 tokenId;
        uint256 checkInTime;
        string checkInType;
        bool verified;
    }

    mapping(uint256 => ActivityMetadata) public activities;
    mapping(uint256 => NFTMetadata) public nftMetadata;
    mapping(uint256 => mapping(address => bool)) public registeredUsers;
    mapping(uint256 => uint256) public activityParticipantCount;
    mapping(uint256 => CheckInRecord[]) public checkInHistory;
    mapping(uint256 => mapping(address => uint256)) public lastCheckInTime;

    event ActivityCreated(
        uint256 indexed activityId,
        string name,
        uint256 startTime,
        uint256 endTime,
        uint256 maxParticipants
    );
    event NFTMinted(
        uint256 indexed tokenId,
        uint256 indexed activityId,
        address indexed participant,
        string userName
    );
    event CheckInVerified(
        uint256 indexed tokenId,
        uint256 indexed activityId,
        address indexed participant,
        uint256 checkInTime
    );
    event CheckInRecorded(
        uint256 indexed tokenId,
        uint256 indexed activityId,
        address indexed participant,
        string checkInType
    );

    constructor() ERC721("HackathonBadge", "HACK") Ownable(msg.sender) {}

    function createActivity(
        string memory _name,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxParticipants,
        string memory _imageURI
    ) external onlyOwner returns (uint256) {
        require(_endTime > _startTime, "Invalid time range");
        require(_maxParticipants > 0, "Max participants must be > 0");

        uint256 activityId = activityCount;
        activityCount++;

        activities[activityId] = ActivityMetadata({
            name: _name,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            maxParticipants: _maxParticipants,
            creator: msg.sender,
            imageURI: _imageURI,
            active: true
        });

        emit ActivityCreated(
            activityId,
            _name,
            _startTime,
            _endTime,
            _maxParticipants
        );
        return activityId;
    }

    function deactivateActivity(uint256 _activityId) external onlyOwner {
        require(_activityId < activityCount, "Activity does not exist");
        activities[_activityId].active = false;
    }

    function getActivity(
        uint256 _activityId
    ) external view returns (ActivityMetadata memory) {
        require(_activityId < activityCount, "Activity does not exist");
        return activities[_activityId];
    }

    function registerAndMintNFT(
        uint256 _activityId,
        address _participant,
        string memory _userName,
        string memory _tokenURI
    ) external onlyOwner returns (uint256) {
        require(_activityId < activityCount, "Activity does not exist");
        require(activities[_activityId].active, "Activity is not active");
        require(
            !registeredUsers[_activityId][_participant],
            "Already registered"
        );
        require(
            activityParticipantCount[_activityId] <
                activities[_activityId].maxParticipants,
            "Activity is full"
        );

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(_participant, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        nftMetadata[tokenId] = NFTMetadata({
            activityId: _activityId,
            participant: _participant,
            registrationTime: block.timestamp,
            userName: _userName,
            checkInCount: 0
        });

        registeredUsers[_activityId][_participant] = true;
        activityParticipantCount[_activityId]++;

        emit NFTMinted(tokenId, _activityId, _participant, _userName);
        return tokenId;
    }

    function isRegistered(
        uint256 _activityId,
        address _participant
    ) external view returns (bool) {
        return registeredUsers[_activityId][_participant];
    }

    function getParticipantCount(
        uint256 _activityId
    ) external view returns (uint256) {
        require(_activityId < activityCount, "Activity does not exist");
        return activityParticipantCount[_activityId];
    }

    function verifyAndCheckIn(
        uint256 _tokenId,
        uint256 _activityId,
        string memory _checkInType
    ) external returns (bool) {
        require(_exists(_tokenId), "Token does not exist");
        require(_activityId < activityCount, "Activity does not exist");

        address tokenOwner = ownerOf(_tokenId);
        NFTMetadata memory metadata = nftMetadata[_tokenId];

        require(
            metadata.activityId == _activityId,
            "NFT does not match activity"
        );
        require(msg.sender == tokenOwner, "Not the token owner");
        require(activities[_activityId].active, "Activity is not active");
        require(
            block.timestamp >= activities[_activityId].startTime,
            "Activity has not started"
        );
        require(
            block.timestamp <= activities[_activityId].endTime,
            "Activity has ended"
        );

        uint256 today = (block.timestamp / 1 days) * 1 days;
        require(
            lastCheckInTime[_tokenId][msg.sender] < today,
            "Already checked in today"
        );

        CheckInRecord memory record = CheckInRecord({
            participant: tokenOwner,
            tokenId: _tokenId,
            checkInTime: block.timestamp,
            checkInType: _checkInType,
            verified: true
        });

        checkInHistory[_activityId].push(record);
        lastCheckInTime[_tokenId][msg.sender] = block.timestamp;
        nftMetadata[_tokenId].checkInCount++;

        emit CheckInVerified(
            _tokenId,
            _activityId,
            tokenOwner,
            block.timestamp
        );
        emit CheckInRecorded(_tokenId, _activityId, tokenOwner, _checkInType);
        return true;
    }

    function getCheckInHistory(
        uint256 _activityId
    ) external view returns (CheckInRecord[] memory) {
        require(_activityId < activityCount, "Activity does not exist");
        return checkInHistory[_activityId];
    }

    function getCheckInCount(uint256 _tokenId) external view returns (uint256) {
        require(_exists(_tokenId), "Token does not exist");
        return nftMetadata[_tokenId].checkInCount;
    }

    function getCheckInStats(
        uint256 _activityId
    )
        external
        view
        returns (
            uint256 totalCheckIns,
            uint256 uniqueParticipants,
            uint256 verifiedCheckIns
        )
    {
        require(_activityId < activityCount, "Activity does not exist");

        CheckInRecord[] memory records = checkInHistory[_activityId];
        address[] memory uniqueAddresses = new address[](records.length);
        uint256 uniqueCount = 0;
        uint256 verifiedCount = 0;

        for (uint256 i = 0; i < records.length; i++) {
            if (records[i].verified) {
                verifiedCount++;
            }

            bool isNew = true;
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (uniqueAddresses[j] == records[i].participant) {
                    isNew = false;
                    break;
                }
            }
            if (isNew) {
                uniqueAddresses[uniqueCount] = records[i].participant;
                uniqueCount++;
            }
        }

        return (records.length, uniqueCount, verifiedCount);
    }

    function getNFTMetadata(
        uint256 _tokenId
    ) external view returns (NFTMetadata memory) {
        require(_exists(_tokenId), "Token does not exist");
        return nftMetadata[_tokenId];
    }

    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function canCheckIn(
        uint256 _tokenId,
        uint256 _activityId
    ) external view returns (bool canCheckInResult, string memory reason) {
        if (!_exists(_tokenId)) {
            return (false, "Token does not exist");
        }

        if (_activityId >= activityCount) {
            return (false, "Activity does not exist");
        }

        if (!activities[_activityId].active) {
            return (false, "Activity is not active");
        }

        NFTMetadata memory metadata = nftMetadata[_tokenId];
        if (metadata.activityId != _activityId) {
            return (false, "NFT does not match activity");
        }

        if (block.timestamp < activities[_activityId].startTime) {
            return (false, "Activity has not started");
        }

        if (block.timestamp > activities[_activityId].endTime) {
            return (false, "Activity has ended");
        }

        uint256 today = (block.timestamp / 1 days) * 1 days;
        if (lastCheckInTime[_tokenId][msg.sender] >= today) {
            return (false, "Already checked in today");
        }

        return (true, "Can check in");
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        try this.ownerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }
}
