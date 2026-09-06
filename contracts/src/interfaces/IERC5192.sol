// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IERC5192 - Minimal Soulbound (locked NFT) interface.
/// @notice Future Kids badges and identities are locked forever: they belong to
///         the learner and can never be sold or transferred. Education is not a
///         financial product.
interface IERC5192 {
    /// @notice Emitted when a token becomes locked (non-transferable).
    event Locked(uint256 tokenId);

    /// @notice Emitted when a token becomes unlocked. Future Kids never unlocks.
    event Unlocked(uint256 tokenId);

    /// @notice Returns true if the token is locked (soulbound).
    function locked(uint256 tokenId) external view returns (bool);
}
