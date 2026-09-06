// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {FutureKidsIdentity} from "../src/FutureKidsIdentity.sol";
import {LearningProof} from "../src/LearningProof.sol";
import {IERC5192} from "../src/interfaces/IERC5192.sol";

contract FutureKidsIdentityTest is Test {
    FutureKidsIdentity internal identity;
    LearningProof internal proof;
    address internal kid;
    address internal other = makeAddr("other");

    uint256 internal tokenId;

    function setUp() public {
        proof = new LearningProof(address(this));
        identity = new FutureKidsIdentity(address(proof), "ipfs://identity-metadata/");
        kid = makeAddr("kid");

        proof.setChapterAnswerHash(1, keccak256(abi.encodePacked("trust")));
        proof.setChapterAnswerHash(2, keccak256(abi.encodePacked(unicode"2100万")));
        proof.setChapterAnswerHash(3, keccak256(abi.encodePacked("proof-of-work")));
        proof.setChapterAnswerHash(4, keccak256(abi.encodePacked("proof-of-stake")));

        vm.prank(kid);
        tokenId = identity.createIdentity("star-rider");
    }

    function test_CreateIdentity() public view {
        assertEq(identity.identityOf(kid), tokenId);
        assertEq(tokenId, 1);
        assertEq(identity.pseudonymOf(tokenId), "star-rider");
        assertEq(identity.levelOf(tokenId), uint8(FutureKidsIdentity.Level.Seed));
        assertEq(identity.identities(tokenId).createdAt, uint64(block.timestamp));
        assertEq(identity.totalIdentities(), 1);
        assertEq(
            identity.tokenURI(tokenId),
            string(abi.encodePacked("ipfs://identity-metadata/", Strings.toString(tokenId), ".json"))
        );
    }

    function test_CannotCreateTwice() public {
        vm.prank(kid);
        vm.expectRevert(FutureKidsIdentity.AlreadyHasIdentity.selector);
        identity.createIdentity("second-thoughts");
    }

    function test_Pseudonym_CannotBeEmpty() public {
        vm.prank(other);
        vm.expectRevert(FutureKidsIdentity.InvalidPseudonym.selector);
        identity.createIdentity("");
    }

    function test_Pseudonym_CannotExceed32Bytes() public {
        vm.prank(other);
        vm.expectRevert(FutureKidsIdentity.InvalidPseudonym.selector);
        identity.createIdentity("this-pseudonym-is-definitely-too-long-x");
    }

    function test_Pseudonym_Exactly32BytesOk() public {
        vm.prank(other);
        identity.createIdentity("0123456789012345678901234567890a"); // exactly 32 chars
    }

    function test_LevelUp_RequiresProof() public {
        vm.prank(kid);
        vm.expectRevert(
            abi.encodeWithSelector(
                FutureKidsIdentity.LevelNotReady.selector,
                uint256(1),
                uint256(0)
            )
        );
        identity.levelUp();
    }

    function test_FullGrowthToGuardian() public {
        string[4] memory answers = ["trust", unicode"2100万", "proof-of-work", "proof-of-stake"];

        vm.startPrank(kid);
        for (uint8 chapter = 1; chapter <= 4; chapter++) {
            // Level-ups are gated by the number of proven chapters:
            // Sprout=1, Explorer=2, Builder=3, Guardian=4.
            proof.recordCompletion(chapter, answers[chapter - 1]);
            assertEq(identity.levelUp(), chapter);
        }
        assertEq(identity.levelOf(tokenId), uint8(FutureKidsIdentity.Level.Guardian));

        vm.expectRevert(FutureKidsIdentity.AlreadyMaxLevel.selector);
        identity.levelUp();
        vm.stopPrank();

        assertEq(proof.completionCount(kid), 4);
    }

    function test_LevelUp_BeforeProofFailsAtEachStep() public {
        vm.startPrank(kid);
        vm.expectRevert(
            abi.encodeWithSelector(
                FutureKidsIdentity.LevelNotReady.selector,
                uint256(1),
                uint256(0)
            )
        );
        identity.levelUp();
        vm.stopPrank();
    }

    function test_Locked() public view {
        assertTrue(identity.locked(tokenId));
    }

    function test_SupportsErc5192() public view {
        assertTrue(identity.supportsInterface(type(IERC5192).interfaceId));
    }

    function test_Soulbound_CannotTransfer() public {
        vm.prank(kid);
        vm.expectRevert(FutureKidsIdentity.Soulbound.selector);
        identity.transferFrom(kid, other, tokenId);
    }

    function test_Soulbound_CannotSafeTransferFrom() public {
        vm.prank(kid);
        vm.expectRevert(FutureKidsIdentity.Soulbound.selector);
        identity.safeTransferFrom(kid, other, tokenId);
    }

    function test_TokenNotFound_Views() public {
        vm.expectRevert(FutureKidsIdentity.TokenNotFound.selector);
        identity.levelOf(999);
        vm.expectRevert(FutureKidsIdentity.TokenNotFound.selector);
        identity.locked(999);
        vm.expectRevert(FutureKidsIdentity.TokenNotFound.selector);
        identity.identities(999);
    }

    function test_LevelUp_WithoutIdentity() public {
        vm.prank(other);
        vm.expectRevert(FutureKidsIdentity.TokenNotFound.selector);
        identity.levelUp();
    }
}
