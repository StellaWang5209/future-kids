// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title LearningProof
/// @notice On-chain, privacy-preserving record of what a child has learned.
///         Stores NO personal data: only anonymous learner addresses, chapter ids,
///         timestamps and hashes. Every badge in the Future Kids system is
///         backed by a record here, so achievements stay verifiable forever.
///
/// Design notes:
///  - Chapter completion is self-recorded but answer-gated: the learner must
///    submit the chapter's final answer, and only `keccak256(answer) ==
///    chapterAnswerHash[chapterId]` accepts it. The answers are public by
///    design -- the point of the platform is learning, not gating.
///  - A platform backend holding RECORDER_ROLE can additionally record
///    challenge completions and badge awards for embedded-wallet journeys.
contract LearningProof is AccessControl, ReentrancyGuard {
    // ------------------------------------------------------------------ types

    /// @notice Kind of learning proof.
    enum ProofKind {
        Chapter,   // finished a full chapter
        Challenge, // finished a bonus challenge
        Badge      // a badge was awarded for this record
    }

    /// @notice One immutable learning record.
    struct Proof {
        uint64 timestamp;    // when it happened
        bytes32 challengeHash; // keccak256 of the answered challenge (or supplied hash)
        ProofKind kind;
        uint8 chapterId;     // 1..5 for the Future Planet Adventure chapters
    }

    // ------------------------------------------------------------------ state

    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    /// @notice learner => all proofs (append-only history).
    mapping(address learner => Proof[] proofs) private _proofs;

    /// @notice learner => chapterId => completed.
    mapping(address learner => mapping(uint8 chapterId => bool completed)) public chapterCompleted;

    /// @notice learner => number of completed chapters.
    mapping(address learner => uint256 count) private _chapterCount;

    /// @notice chapterId => keccak256 of the accepted final answer.
    mapping(uint8 chapterId => bytes32 answerHash) public chapterAnswerHash;

    // ----------------------------------------------------------------- events

    event ProofRecorded(
        address indexed learner,
        ProofKind kind,
        uint8 indexed chapterId,
        bytes32 challengeHash,
        uint64 timestamp
    );
    event ChapterAnswerHashSet(uint8 indexed chapterId, bytes32 answerHash);

    // ----------------------------------------------------------------- errors

    error ChapterNotConfigured();
    error ZeroAnswerHash();
    error EmptyAnswer();
    error AnswerTooLong();
    error WrongAnswer();
    error ChapterAlreadyCompleted();
    error InvalidLearner();

    // ------------------------------------------------------------ constructor

    /// @param admin receives DEFAULT_ADMIN_ROLE and RECORDER_ROLE.
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RECORDER_ROLE, admin);
    }

    // ---------------------------------------------------------------- admin

    /// @notice Configure the accepted final answer for a chapter.
    ///         Open by design: answers are part of the learning content.
    function setChapterAnswerHash(uint8 chapterId, bytes32 answerHash)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (answerHash == bytes32(0)) revert ZeroAnswerHash();
        chapterAnswerHash[chapterId] = answerHash;
        emit ChapterAnswerHashSet(chapterId, answerHash);
    }

    // ------------------------------------------------------------------ kid

    /// @notice A learner records that they completed a chapter by submitting
    ///         its final answer. Permissionless, gas paid by the learner (or
    ///         a guardian's wallet / AA bundler).
    function recordCompletion(uint8 chapterId, string calldata answer)
        external
        nonReentrant
    {
        bytes32 expected = chapterAnswerHash[chapterId];
        if (expected == bytes32(0)) revert ChapterNotConfigured();

        uint256 len = bytes(answer).length;
        if (len == 0) revert EmptyAnswer();
        if (len > 64) revert AnswerTooLong();

        if (chapterCompleted[msg.sender][chapterId]) revert ChapterAlreadyCompleted();
        if (keccak256(abi.encodePacked(answer)) != expected) revert WrongAnswer();

        chapterCompleted[msg.sender][chapterId] = true;
        unchecked {
            _chapterCount[msg.sender] += 1;
        }
        _record(msg.sender, ProofKind.Chapter, chapterId, keccak256(abi.encodePacked(answer)));
    }

    // -------------------------------------------------------------- platform

    /// @notice Platform backend records challenge completions / badge awards.
    function recordByRecorder(address learner, ProofKind kind, uint8 chapterId, bytes32 challengeHash)
        external
        onlyRole(RECORDER_ROLE)
    {
        if (learner == address(0)) revert InvalidLearner();
        _record(learner, kind, chapterId, challengeHash);
    }

    // ----------------------------------------------------------------- views

    function completionCount(address learner) external view returns (uint256) {
        return _chapterCount[learner];
    }

    function hasCompleted(address learner, uint8 chapterId) external view returns (bool) {
        return chapterCompleted[learner][chapterId];
    }

    function proofCount(address learner) external view returns (uint256) {
        return _proofs[learner].length;
    }

    function getProof(address learner, uint256 index) external view returns (Proof memory) {
        return _proofs[learner][index];
    }

    function getAllProofs(address learner) external view returns (Proof[] memory) {
        return _proofs[learner];
    }

    // --------------------------------------------------------------- internal

    function _record(address learner, ProofKind kind, uint8 chapterId, bytes32 challengeHash)
        private
    {
        Proof memory proof = Proof({
            timestamp: uint64(block.timestamp),
            challengeHash: challengeHash,
            kind: kind,
            chapterId: chapterId
        });
        _proofs[learner].push(proof);
        emit ProofRecorded(learner, kind, chapterId, challengeHash, proof.timestamp);
    }
}
