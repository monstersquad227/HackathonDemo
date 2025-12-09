// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RegistrationSBT
 * @dev Soulbound Token (SBT) for event registration - non-transferable NFT
 */
contract RegistrationSBT is ERC721Enumerable, Ownable, ReentrancyGuard {
    // Event ID to token ID mapping
    mapping(uint256 => uint256[]) public eventTokens;
    
    // Token ID to event ID mapping
    mapping(uint256 => uint256) public tokenToEvent;
    
    // Token ID to registration data
    mapping(uint256 => RegistrationData) public tokenData;
    
    // Base URI for token metadata
    string private _baseTokenURI;
    
    // Token counter
    uint256 private _tokenCounter;
    
    // Registration data structure
    struct RegistrationData {
        uint256 eventId;
        address teamLeader;
        string teamName;
        uint256 registeredAt;
    }
    
    // Events
    event RegistrationMinted(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed recipient,
        string teamName
    );
    
    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable(msg.sender) {}
    
    /**
     * @dev Mint a registration SBT (only owner/organizer can call)
     * @param to Recipient address (team leader)
     * @param eventId Event ID
     * @param teamName Team name
     */
    function mintRegistration(
        address to,
        uint256 eventId,
        string memory teamName
    ) public onlyOwner nonReentrant returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(teamName).length > 0, "Team name cannot be empty");
        
        _tokenCounter++;
        uint256 tokenId = _tokenCounter;
        
        _safeMint(to, tokenId);
        
        tokenToEvent[tokenId] = eventId;
        eventTokens[eventId].push(tokenId);
        
        tokenData[tokenId] = RegistrationData({
            eventId: eventId,
            teamLeader: to,
            teamName: teamName,
            registeredAt: block.timestamp
        });
        
        emit RegistrationMinted(tokenId, eventId, to, teamName);
        
        return tokenId;
    }
    
    /**
     * @dev Batch mint registrations
     */
    function batchMintRegistrations(
        address[] memory recipients,
        uint256[] memory eventIds,
        string[] memory teamNames
    ) public onlyOwner nonReentrant returns (uint256[] memory) {
        require(
            recipients.length == eventIds.length && eventIds.length == teamNames.length,
            "Arrays length mismatch"
        );
        
        uint256[] memory tokenIds = new uint256[](recipients.length);
        
        for (uint256 i = 0; i < recipients.length; i++) {
            tokenIds[i] = mintRegistration(recipients[i], eventIds[i], teamNames[i]);
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Override _update to make token non-transferable
     */
    function _update(address to, uint256 tokenId, address auth) internal virtual override(ERC721Enumerable) returns (address) {
        address from = _ownerOf(tokenId);
        // Allow minting (from == address(0))
        if (from != address(0)) {
            revert("SBT: Token is non-transferable");
        }
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Get tokens for an event
     * @param eventId Event ID
     */
    function getEventTokens(uint256 eventId) public view returns (uint256[] memory) {
        return eventTokens[eventId];
    }
    
    /**
     * @dev Get registration data for a token
     * @param tokenId Token ID
     */
    function getRegistrationData(uint256 tokenId) public view returns (RegistrationData memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenData[tokenId];
    }
    
    /**
     * @dev Check if address has registration for event
     * @param owner Address to check
     * @param eventId Event ID
     */
    function hasRegistration(address owner, uint256 eventId) public view returns (bool) {
        uint256 balance = balanceOf(owner);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            if (tokenToEvent[tokenId] == eventId) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Get registration token ID for address and event
     * @param owner Address to check
     * @param eventId Event ID
     */
    function getRegistrationTokenId(address owner, uint256 eventId) public view returns (uint256) {
        uint256 balance = balanceOf(owner);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            if (tokenToEvent[tokenId] == eventId) {
                return tokenId;
            }
        }
        revert("No registration found");
    }
    
    /**
     * @dev Set base URI for token metadata
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Get base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Get total token count
     */
    function totalSupply() public view override returns (uint256) {
        return _tokenCounter;
    }
}

