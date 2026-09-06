// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IERC5192} from "./interfaces/IERC5192.sol";
import {ILearningProof} from "./interfaces/ILearningProof.sol";

/// @title FutureKidsIdentity
/// @notice A child's digital identity on the Future Planet: a soulbound,
///         non-transferable ERC-721 token (ERC-5192 locked) that grows with
///         the learner.
///
/// PRIVACY FIRST:
///  - No name, birthday, school, location or any real-world identity is ever
///    stored. Only a self-chosen pseudonym and an anonymous address.
///  - Parents/guardians should be reminded that anything on-chain is public.
contract FutureKidsIdentity is ERC721, AccessControl, IERC5192 {
    // ------------------------------------------------------------------ types

    /// @notice Learning levels: a kid grows from a seed into a guardian.
    enum Level {
        Seed,     // 0 - just arrived on the Future Planet
        Sprout,   // 1 - completed 1 chapter
        Explorer, // 2 - completed 2 chapters
        Builder,  // 3 - completed 3 chapters
        Guardian  // 4 - completed all 4 chapters
    }

    /// @notice Minimal identity data. Nothing here identifies a real child.
    struct Identity {
        uint64 createdAt;
        uint8 level;
        string pseudonym;
    }

    // ------------------------------------------------------------------ state

    uint8 public constant MAX_LEVEL = uint8(Level.Guardian);

    mapping(uint256 tokenId => Identity identity) private _identities;

    /// @notice learner address => identity token id (0 = none). One per learner.
    mapping(address learner => uint256 tokenId) public identityOf;

    uint256 private _nextTokenId;

    string private _baseTokenURI;

    /// @notice Learning history oracle used to gate level-ups.
    ILearningProof public immutable learningProof;

    // ----------------------------------------------------------------- events

    event IdentityCreated(address indexed learner, uint256 indexed tokenId, string pseudonym, uint64 createdAt);
    event LevelUp(address indexed learner, uint256 indexed tokenId, uint8 newLevel);

    // ----------------------------------------------------------------- errors

    error Soulbound();
    error AlreadyHasIdentity();
    error InvalidPseudonym();
    error TokenNotFound();
    error LevelNotReady(uint256 requiredChapters, uint256 completedChapters);
    error AlreadyMaxLevel();
    error BaseUriTooLong();

    // ------------------------------------------------------------ constructor

    /// @param learningProof_ address of the LearningProof contract.
    /// @param baseTokenURI_ IPFS (or HTTPS) folder ending with "/", e.g. "ipfs://<CID>/".
    constructor(address learningProof_, string memory baseTokenURI_)
        ERC721("Future Kids Identity", "FKID")
    {
        if (bytes(baseTokenURI_).length > 128) revert BaseUriTooLong();
        learningProof = ILearningProof(learningProof_);
        _baseTokenURI = baseTokenURI_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ------------------------------------------------------------- external

    /// @notice Create your anonymous identity on the Future Planet. Free forever.
    /// @param pseudonym a nickname the child invents (max 32 bytes, no real names!).
    function createIdentity(string calldata pseudonym) external returns (uint256 tokenId) {
        if (identityOf[msg.sender] != 0) revert AlreadyHasIdentity();

        uint256 len = bytes(pseudonym).length;
        if (len == 0 || len > 32) revert InvalidPseudonym();

        unchecked {
            tokenId = ++_nextTokenId;
        }
        identityOf[msg.sender] = tokenId;
        _identities[tokenId] = Identity({
            createdAt: uint64(block.timestamp),
            level: uint8(Level.Seed),
            pseudonym: pseudonym
        });

        _mint(msg.sender, tokenId);
        emit Locked(tokenId);
        emit IdentityCreated(msg.sender, tokenId, pseudonym, uint64(block.timestamp));
    }

    /// @notice Grow to the next level once enough chapters are proven on-chain.
    /// @return newLevel the level reached.
    function levelUp() external returns (uint8 newLevel) {
        uint256 tokenId = identityOf[msg.sender];
        if (tokenId == 0) revert TokenNotFound();

        Identity storage ident = _identities[tokenId];
        uint8 current = ident.level;
        if (current >= MAX_LEVEL) revert AlreadyMaxLevel();

        newLevel = current + 1;
        uint256 required = levelRequirement(newLevel);
        uint256 completed = learningProof.completionCount(msg.sender);
        if (completed < required) revert LevelNotReady({requiredChapters: required, completedChapters: completed});

        ident.level = newLevel;
        emit LevelUp(msg.sender, tokenId, newLevel);
    }

    // ------------------------------------------------------------------ views

    function levelRequirement(uint8 level) public pure returns (uint256) {
        // Sprout=1, Explorer=2, Builder=3, Guardian=4 chapters.
        if (level == 0 || level > MAX_LEVEL) return 0;
        return uint256(level);
    }

    function identities(uint256 tokenId) external view returns (Identity memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenNotFound();
        return _identities[tokenId];
    }

    function levelOf(uint256 tokenId) external view returns (uint8) {
        if (_ownerOf(tokenId) == address(0)) revert TokenNotFound();
        return _identities[tokenId].level;
    }

    function pseudonymOf(uint256 tokenId) external view returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenNotFound();
        return _identities[tokenId].pseudonym;
    }

    function totalIdentities() external view returns (uint256) {
        return _nextTokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(_baseTokenURI, Strings.toString(tokenId), ".json"));
    }

    /// @notice ERC-5192: identity tokens are always locked.
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
