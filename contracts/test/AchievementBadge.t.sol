// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {AchievementBadge} from "../src/AchievementBadge.sol";
import {LearningProof} from "../src/LearningProof.sol";
import {IERC5192} from "../src/interfaces/IERC5192.sol";

contract AchievementBadgeTest is Test {
    AchievementBadge internal badge;
    LearningProof internal proof;
    address internal kid;
    address internal kid2;
    address internal stranger = makeAddr("stranger");

    function setUp() public {
        proof = new LearningProof(address(this));
        badge = new AchievementBadge(address(proof), "ipfs://badge-metadata/");
        kid = makeAddr("kid");
        kid2 = makeAddr("kid2");

        proof.setChapterAnswerHash(1, keccak256(abi.encodePacked("trust")));
        proof.setChapterAnswerHash(2, keccak256(abi.encodePacked(unicode"2100万")));
    }

    function test_Mint_RevertsWithoutProof() public {
        vm.prank(kid);
        vm.expectRevert(abi.encodeWithSelector(AchievementBadge.ChapterNotCompleted.selector, uint8(1)));
        badge.mint(AchievementBadge.BadgeType.BlockchainExplorer);
    }

    function test_Mint_AfterChapterCompletion() public {
        vm.prank(kid);
        proof.recordCompletion(1, "trust");

        vm.prank(kid);
        badge.mint(AchievementBadge.BadgeType.BlockchainExplorer);

        assertTrue(badge.hasBadge(kid, AchievementBadge.BadgeType.BlockchainExplorer));
        assertEq(badge.balanceOf(kid), 1);
        assertEq(badge.ownerOf(1), kid);
        assertEq(uint8(badge.badgeTypeOf(1)), uint8(AchievementBadge.BadgeType.BlockchainExplorer));
        assertEq(badge.totalBadgesMinted(), 1);
        assertEq(badge.badgesOf(kid).length, 1);
        assertEq(badge.badgeName(AchievementBadge.BadgeType.BlockchainExplorer), "Blockchain Explorer");
        assertEq(
            badge.tokenURI(1),
            string(abi.encodePacked("ipfs://badge-metadata/", Strings.toString(1), ".json"))
        );
    }

    function test_Mint_DuplicateReverts() public {
        vm.startPrank(kid);
        proof.recordCompletion(1, "trust");
        badge.mint(AchievementBadge.BadgeType.BlockchainExplorer);

        vm.expectRevert(
            abi.encodeWithSelector(
                AchievementBadge.AlreadyEarned.selector,
                AchievementBadge.BadgeType.BlockchainExplorer
            )
        );
        badge.mint(AchievementBadge.BadgeType.BlockchainExplorer);
        vm.stopPrank();

        assertEq(badge.balanceOf(kid), 1); // still exactly one
    }

    function test_MintTo_RequiresMinterRole() public {
        bytes32 minterRole = badge.MINTER_ROLE(); // hoisted: view calls consume vm.prank
        vm.prank(kid);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                kid,
                minterRole
            )
        );
        badge.mintTo(kid, AchievementBadge.BadgeType.BitcoinPioneer);
    }

    function test_MintTo_SuccessWithProof() public {
        vm.prank(kid2);
        proof.recordCompletion(2, unicode"2100万");

        badge.mintTo(kid2, AchievementBadge.BadgeType.BitcoinPioneer);

        assertTrue(badge.hasBadge(kid2, AchievementBadge.BadgeType.BitcoinPioneer));
        assertEq(badge.ownerOf(1), kid2);
        assertEq(badge.badgeName(AchievementBadge.BadgeType.BitcoinPioneer), "Bitcoin Pioneer");
    }

    function test_MintTo_RequiresProofEvenForMinter() public {
        vm.expectRevert(abi.encodeWithSelector(AchievementBadge.ChapterNotCompleted.selector, uint8(2)));
        badge.mintTo(kid2, AchievementBadge.BadgeType.BitcoinPioneer);
    }

    function test_MintTo_ZeroAddress() public {
        vm.expectRevert(AchievementBadge.InvalidRecipient.selector);
        badge.mintTo(address(0), AchievementBadge.BadgeType.BlockchainExplorer);
    }

    function test_Locked() public {
        vm.prank(kid);
        proof.recordCompletion(1, "trust");
        vm.prank(kid);
        badge.mint(AchievementBadge.BadgeType.BlockchainExplorer);

        assertTrue(badge.locked(1));
        assertTrue(badge.supportsInterface(type(IERC5192).interfaceId));
    }

    function test_Soulbound_CannotTransfer() public {
        vm.startPrank(kid);
        proof.recordCompletion(1, "trust");
        badge.mint(AchievementBadge.BadgeType.BlockchainExplorer);

        vm.expectRevert(AchievementBadge.Soulbound.selector);
        badge.transferFrom(kid, stranger, 1);
        vm.stopPrank();
    }

    function test_Soulbound_CannotApproveAndMove() public {
        vm.startPrank(kid);
        proof.recordCompletion(1, "trust");
        badge.mint(AchievementBadge.BadgeType.BlockchainExplorer);
        badge.approve(stranger, 1);
        vm.stopPrank();

        vm.prank(stranger);
        vm.expectRevert(AchievementBadge.Soulbound.selector);
        badge.transferFrom(kid, stranger, 1);
    }
}
