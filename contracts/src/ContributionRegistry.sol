// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title ContributionRegistry
/// @notice Public-good contribution registry for the Future Kids open source
///         community. Records code, translation, education and design
///         contributions so that future community governance can recognize
///         the builders of this children's education infrastructure.
contract ContributionRegistry is AccessControl {
    // ------------------------------------------------------------------ types

    /// @notice Kind of contribution.
    enum Category {
        Code,       // smart contracts, frontend, backend, infra
        Translation,// docs, lessons, UI localization
        Education,  // teacher guides, lesson plans, classrooms
        Design,     // art, games, kid-friendly UX
        Community   // moderation, mentorship, spreading the word
    }

    /// @notice One contribution record. Content stays off-chain (GitHub PR,
    ///         IPFS doc, etc.); only its hash and pointer live here.
    struct Contribution {
        uint64 timestamp;
        Category category;
        bytes32 contentHash;
        string uri;
        uint32 points;
    }

    // ------------------------------------------------------------------ state

    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    mapping(address contributor => Contribution[] contributions) private _contributions;
    mapping(address contributor => uint32 points) public totalPoints;
    mapping(Category category => uint256 count) public contributionsByCategory;
    uint256 public totalContributions;

    // ----------------------------------------------------------------- events

    event ContributionRecorded(
        address indexed contributor,
        Category category,
        bytes32 contentHash,
        string uri,
        uint32 points,
        uint64 timestamp
    );

    // ----------------------------------------------------------------- errors

    error InvalidContributor();
    error ZeroPoints();
    error UriTooLong();

    // ------------------------------------------------------------ constructor

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RECORDER_ROLE, admin);
    }

    // ------------------------------------------------------------- external

    /// @notice Record a contribution. In the decentralized future this will be
    ///         called by community-curated processes (DAO/multisig), never by
    ///         self-declared claims.
    function recordContribution(
        address contributor,
        Category category,
        bytes32 contentHash,
        string calldata uri,
        uint32 points
    ) external onlyRole(RECORDER_ROLE) {
        if (contributor == address(0)) revert InvalidContributor();
        if (points == 0) revert ZeroPoints();
        if (bytes(uri).length > 256) revert UriTooLong();

        _contributions[contributor].push(
            Contribution({
                timestamp: uint64(block.timestamp),
                category: category,
                contentHash: contentHash,
                uri: uri,
                points: points
            })
        );
        unchecked {
            totalPoints[contributor] += points;
            totalContributions += 1;
            contributionsByCategory[category] += 1;
        }
        emit ContributionRecorded(contributor, category, contentHash, uri, points, uint64(block.timestamp));
    }

    // ------------------------------------------------------------------ views

    function contributionCount(address contributor) external view returns (uint256) {
        return _contributions[contributor].length;
    }

    function getContribution(address contributor, uint256 index)
        external
        view
        returns (Contribution memory)
    {
        return _contributions[contributor][index];
    }

    function getContributions(address contributor)
        external
        view
        returns (Contribution[] memory)
    {
        return _contributions[contributor];
    }
}
