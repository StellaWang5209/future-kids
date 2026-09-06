// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ILearningProof - read interface for the on-chain learning history.
/// @notice Consumed by FutureKidsIdentity (for level-ups) and AchievementBadge
///         (for badge minting) so that every on-chain achievement is backed by
///         a verifiable learning record.
interface ILearningProof {
    /// @notice Number of chapters the learner has completed on-chain.
    function completionCount(address learner) external view returns (uint256);

    /// @notice Whether the learner completed the given chapter (1..4).
    function hasCompleted(address learner, uint8 chapterId) external view returns (bool);
}
