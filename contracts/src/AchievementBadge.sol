// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC5192} from "./interfaces/IERC5192.sol";
import {ILearningProof} from "./interfaces/ILearningProof.sol";

/// @title AchievementBadge
/// @notice Soulbound ERC-721 (ERC-5192 locked) learning badges. A badge proves
///         a child completed a chapter of the Future Planet Adventure.
///         Badges CANNOT be bought, sold or transferred: they are memories,
///         not assets.
contract AchievementBadge is ERC721, AccessControl, ReentrancyGuard, IERC5192 {
    // ------------------------------------------------------------------ types

    /// @notice The four launch badges, one per chapter.
    enum BadgeType {
        BlockchainExplorer, // 0 - Chapter 1: Blockchain World (Magic Notebook)
        BitcoinPioneer,     // 1 - Chapter 2: Bitcoin World
        PowBuilder,         // 2 - Chapter 3: PoW World
        PosGuardian         // 3 - Chapter 4: PoS World
    }

    // ------------------------------------------------------------------ state

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice learner => badgeType => already earned (one per type, forever).
    mapping(address learner => mapping(BadgeType badgeType => bool earned)) public hasBadge;

    /// @notice tokenId => badge type.
    mapping(uint256 tokenId => BadgeType badgeType) public badgeTypeOf;

    /// @notice learner => all their badge token ids (for the growth map).
    mapping(address learner => uint256[] tokenIds) private _badgesOf;

    uint256 private _nextTokenId;

    string private _baseTokenURI;

    /// @notice Learning history oracle: a badge can only be minted after the
    ///         matching chapter completion is proven on LearningProof.
    ILearningProof public immutable learningProof;

    // ----------------------------------------------------------------- events

    event BadgeMinted(address indexed learner, BadgeType indexed badgeType, uint256 indexed tokenId);

    // ----------------------------------------------------------------- errors

    error Soulbound();
    error AlreadyEarned(BadgeType badgeType);
    error ChapterNotCompleted(uint8 chapterId);
    error InvalidRecipient();
    error TokenNotFound();
    error BaseUriTooLong();

    // ------------------------------------------------------------ constructor

    /// @param learningProof_ address of the LearningProof contract.
    /// @param baseTokenURI_ IPFS folder ending with "/", e.g. "ipfs://<CID>/".
    constructor(address learningProof_, string memory baseTokenURI_)
        ERC721("Future Kids Achievement Badge", "FKB")
    {
        if (bytes(baseTokenURI_).length > 128) revert BaseUriTooLong();
        learningProof = ILearningProof(learningProof_);
        _baseTokenURI = baseTokenURI_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // ------------------------------------------------------------- external

    /// @notice Claim your badge yourself after completing the chapter on-chain.
    function mint(BadgeType badgeType) external nonReentrant {
        if (hasBadge[msg.sender][badgeType]) revert AlreadyEarned(badgeType);

        uint8 chapterId = chapterForBadge(badgeType);
        if (!learningProof.hasCompleted(msg.sender, chapterId)) {
            revert ChapterNotCompleted(chapterId);
        }

        _mintBadge(msg.sender, badgeType);
    }

    /// @notice Platform (MINTER_ROLE) mints on behalf of a learner, e.g. for
    ///         embedded-wallet / guardian-managed journeys. Still proof-gated.
    function mintTo(address learner, BadgeType badgeType) external onlyRole(MINTER_ROLE) {
        if (learner == address(0)) revert InvalidRecipient();
        if (hasBadge[learner][badgeType]) revert AlreadyEarned(badgeType);

        uint8 chapterId = chapterForBadge(badgeType);
        if (!learningProof.hasCompleted(learner, chapterId)) {
            revert ChapterNotCompleted(chapterId);
        }

        _mintBadge(learner, badgeType);
    }

    // ------------------------------------------------------------------ views

    /// @notice Badge i is earned by completing chapter i+1.
    function chapterForBadge(BadgeType badgeType) public pure returns (uint8) {
        return uint8(badgeType) + 1;
    }

    function badgeName(BadgeType badgeType) external pure returns (string memory) {
        if (badgeType == BadgeType.BlockchainExplorer) return "Blockchain Explorer";
        if (badgeType == BadgeType.BitcoinPioneer) return "Bitcoin Pioneer";
        if (badgeType == BadgeType.PowBuilder) return "PoW Builder";
        if (badgeType == BadgeType.PosGuardian) return "PoS Guardian";
        return "Unknown";
    }

    function badgesOf(address learner) external view returns (uint256[] memory) {
        return _badgesOf[learner];
    }

    function totalBadgesMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(_baseTokenURI, Strings.toString(tokenId), ".json"));
    }

    /// @notice ERC-5192: badges are always locked. Education is not a market.
    function locked(uint256 tokenId) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert TokenNotFound();
        return true;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }

    // --------------------------------------------------------------- internal

    function _mintBadge(address learner, BadgeType badgeType) private {
        uint256 tokenId;
        unchecked {
            tokenId = ++_nextTokenId;
        }
        hasBadge[learner][badgeType] = true;
        badgeTypeOf[tokenId] = badgeType;
        _badgesOf[learner].push(tokenId);

        _mint(learner, tokenId);
        emit Locked(tokenId);
        emit BadgeMinted(learner, badgeType, tokenId);
    }

    /// @notice Soulbound: transfers are impossible. Mint and burn are allowed.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
