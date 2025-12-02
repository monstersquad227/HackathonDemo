// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SubmissionRegistry
 * @dev Stores hashes/fingerprints of project submissions on-chain
 */
contract SubmissionRegistry {
    struct Submission {
        uint256 eventId;
        uint256 teamId;
        bytes32 hash;
        string metadataURI;
        uint256 timestamp;
    }

    // Mapping submission ID => data
    mapping(uint256 => Submission) public submissions;
    uint256 public submissionCounter;

    event SubmissionRegistered(
        uint256 indexed submissionId,
        uint256 indexed eventId,
        uint256 indexed teamId,
        bytes32 hash,
        string metadataURI
    );

    /**
     * @dev Register a submission fingerprint
     * @param eventId Event identifier
     * @param teamId Team identifier
     * @param hash Submission fingerprint (sha256/IPFS hash)
     * @param metadataURI Off-chain metadata URI (IPFS/Arweave)
     */
    function registerSubmission(
        uint256 eventId,
        uint256 teamId,
        bytes32 hash,
        string memory metadataURI
    ) public returns (uint256) {
        require(hash != bytes32(0), "Invalid hash");
        submissionCounter++;

        submissions[submissionCounter] = Submission({
            eventId: eventId,
            teamId: teamId,
            hash: hash,
            metadataURI: metadataURI,
            timestamp: block.timestamp
        });

        emit SubmissionRegistered(
            submissionCounter,
            eventId,
            teamId,
            hash,
            metadataURI
        );

        return submissionCounter;
    }

    /**
     * @dev Get submission info
     */
    function getSubmission(uint256 submissionId) public view returns (Submission memory) {
        return submissions[submissionId];
    }
}

