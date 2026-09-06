// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FutureKidsIdentity} from "../src/FutureKidsIdentity.sol";
import {AchievementBadge} from "../src/AchievementBadge.sol";
import {LearningProof} from "../src/LearningProof.sol";
import {ContributionRegistry} from "../src/ContributionRegistry.sol";

/// @notice End-to-end journey of one child through the Future Planet Adventure:
///         identity -> learn chapters -> earn all four soulbound badges ->
///         grow from Seed to Guardian -> contribute back to the public good.
contract IntegrationTest is Test {
    LearningProof internal proof;
    FutureKidsIdentity internal identity;
    AchievementBadge internal badge;
    ContributionRegistry internal registry;

    address internal kid;
    uint256 internal tokenId;

    string[4] internal ANSWERS = ["trust", unicode"2100万", "proof-of-work", "proof-of-stake"];

    function setUp() public {
        kid = makeAddr("kid");

        // Deploy the whole suite exactly like DeployAll.s.sol does.
        proof = new LearningProof(address(this));
        identity = new FutureKidsIdentity(address(proof), "ipfs://identity-metadata/");
        badge = new AchievementBadge(address(proof), "ipfs://badge-metadata/");
        registry = new ContributionRegistry(address(this));

        for (uint8 chapter = 1; chapter <= 4; chapter++) {
            proof.setChapterAnswerHash(chapter, keccak256(abi.encodePacked(ANSWERS[chapter - 1])));
        }

        vm.prank(kid);
        tokenId = identity.createIdentity("little-miner");
    }

    function test_CompleteAdventure() public {
        vm.startPrank(kid);

        // ---------- Chapter 1: Blockchain World ----------
        vm.expectRevert(abi.encodeWithSelector(AchievementBadge.ChapterNotCompleted.selector, uint8(1)));
        badge.mint(AchievementBadge.BadgeType.BlockchainExplorer); // no proof yet!

        proof.recordCompletion(1, ANSWERS[0]);
        badge.mint(AchievementBadge.BadgeType.BlockchainExplorer);
        assertEq(identity.levelUp(), uint8(1)); // Seed -> Sprout

        // ---------- Chapter 2: Bitcoin World ----------
        proof.recordCompletion(2, ANSWERS[1]);
        badge.mint(AchievementBadge.BadgeType.BitcoinPioneer);
        assertEq(identity.levelUp(), uint8(2)); // Sprout -> Explorer

        // ---------- Chapter 3: PoW World ----------
        proof.recordCompletion(3, ANSWERS[2]);
        badge.mint(AchievementBadge.BadgeType.PowBuilder);
        assertEq(identity.levelUp(), uint8(3)); // Explorer -> Builder

        // ---------- Chapter 4: PoS World ----------
        proof.recordCompletion(4, ANSWERS[3]);
        badge.mint(AchievementBadge.BadgeType.PosGuardian);
        assertEq(identity.levelUp(), uint8(4)); // Builder -> Guardian

        vm.stopPrank();

        // ---------- Assertions: the whole journey is on-chain ----------
        assertEq(identity.levelOf(tokenId), uint8(FutureKidsIdentity.Level.Guardian));
        assertEq(badge.balanceOf(kid), 4);
        assertEq(badge.badgesOf(kid).length, 4);
        assertEq(proof.completionCount(kid), 4);
        assertEq(proof.proofCount(kid), 4);

        uint256[] memory tokens = badge.badgesOf(kid);
        for (uint256 i = 0; i < tokens.length; i++) {
            assertTrue(badge.hasBadge(kid, AchievementBadge.BadgeType(i)));
            assertTrue(badge.locked(tokens[i]));
            assertEq(badge.ownerOf(tokens[i]), kid);
        }

        // ---------- Nothing is sellable ----------
        vm.prank(kid);
        vm.expectRevert(FutureKidsIdentity.Soulbound.selector);
        identity.transferFrom(kid, address(0xBEEF), tokenId);

        vm.prank(kid);
        vm.expectRevert(AchievementBadge.Soulbound.selector);
        badge.transferFrom(kid, address(0xBEEF), tokens[0]);
    }

    function test_GivingBackToThePublicGood() public {
        test_CompleteAdventure();

        // The community records the kid's first translation contribution.
        registry.recordContribution(
            kid,
            ContributionRegistry.Category.Translation,
            keccak256("chapter-3-zh-translation"),
            "ipfs://translation-ch3",
            5
        );

        assertEq(registry.totalPoints(kid), 5);
        assertEq(registry.contributionCount(kid), 1);
    }

    function test_BadgeCannotSkipLearningProof() public {
        // Even the platform (minter) cannot award badges without a proof.
        vm.expectRevert(abi.encodeWithSelector(AchievementBadge.ChapterNotCompleted.selector, uint8(4)));
        badge.mintTo(kid, AchievementBadge.BadgeType.PosGuardian);
    }
}
