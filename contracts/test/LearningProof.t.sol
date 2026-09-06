// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {LearningProof} from "../src/LearningProof.sol";

contract LearningProofTest is Test {
    LearningProof internal proof;
    address internal kid;
    address internal stranger = makeAddr("stranger");

    bytes32 internal constant ANSWER1_HASH = keccak256(abi.encodePacked("trust"));

    function setUp() public {
        proof = new LearningProof(address(this));
        kid = makeAddr("kid");
        proof.setChapterAnswerHash(1, ANSWER1_HASH);
    }

    function test_AdminCanConfigureChapterAnswer() public view {
        assertEq(proof.chapterAnswerHash(1), ANSWER1_HASH);
    }

    function test_NonAdminCannotConfigureChapterAnswer() public {
        bytes32 adminRole = proof.DEFAULT_ADMIN_ROLE(); // hoisted: view calls consume vm.prank
        vm.prank(kid);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                kid,
                adminRole
            )
        );
        proof.setChapterAnswerHash(2, bytes32(uint256(1)));
    }

    function test_CannotUseZeroAnswerHash() public {
        vm.expectRevert(LearningProof.ZeroAnswerHash.selector);
        proof.setChapterAnswerHash(2, bytes32(0));
    }

    function test_RecordCompletion_Success() public {
        vm.prank(kid);
        proof.recordCompletion(1, "trust");

        assertTrue(proof.hasCompleted(kid, 1));
        assertEq(proof.completionCount(kid), 1);
        assertEq(proof.proofCount(kid), 1);

        LearningProof.Proof memory p = proof.getProof(kid, 0);
        assertEq(uint8(p.kind), uint8(LearningProof.ProofKind.Chapter));
        assertEq(uint256(p.challengeHash), uint256(ANSWER1_HASH));
        assertEq(p.timestamp, block.timestamp);
    }

    function test_RecordCompletion_WrongAnswer() public {
        vm.prank(kid);
        vm.expectRevert(LearningProof.WrongAnswer.selector);
        proof.recordCompletion(1, "banana");
    }

    function test_RecordCompletion_TwiceFails() public {
        vm.startPrank(kid);
        proof.recordCompletion(1, "trust");
        vm.expectRevert(LearningProof.ChapterAlreadyCompleted.selector);
        proof.recordCompletion(1, "trust");
        vm.stopPrank();
    }

    function test_RecordCompletion_UnconfiguredChapter() public {
        vm.prank(kid);
        vm.expectRevert(LearningProof.ChapterNotConfigured.selector);
        proof.recordCompletion(99, "trust");
    }

    function test_RecordCompletion_EmptyAnswer() public {
        vm.prank(kid);
        vm.expectRevert(LearningProof.EmptyAnswer.selector);
        proof.recordCompletion(1, "");
    }

    function test_RecordCompletion_AnswerTooLong() public {
        vm.prank(kid);
        vm.expectRevert(LearningProof.AnswerTooLong.selector);
        proof.recordCompletion(1, "this answer is definitely much longer than sixty four bytes, truly");
    }

    function test_RecordByRecorder_RequiresRole() public {
        bytes32 recorderRole = proof.RECORDER_ROLE(); // hoisted: view calls consume vm.prank
        vm.prank(kid);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                kid,
                recorderRole
            )
        );
        proof.recordByRecorder(kid, LearningProof.ProofKind.Challenge, 1, bytes32(uint256(42)));
    }

    function test_RecordByRecorder_Success() public {
        bytes32 hash = keccak256("bonus-challenge-1");
        proof.recordByRecorder(kid, LearningProof.ProofKind.Challenge, 1, hash);

        assertEq(proof.proofCount(kid), 1);
        assertEq(proof.completionCount(kid), 0); // challenges don't count as chapters
        LearningProof.Proof memory p = proof.getProof(kid, 0);
        assertEq(uint8(p.kind), uint8(LearningProof.ProofKind.Challenge));
    }

    function test_Fuzz_RecordCompletion(bytes calldata answer) public {
        vm.assume(bytes(answer).length > 0 && bytes(answer).length <= 64);
        bytes32 h = keccak256(abi.encodePacked(answer));
        proof.setChapterAnswerHash(5, h);

        vm.prank(kid);
        proof.recordCompletion(5, string(answer));

        assertTrue(proof.hasCompleted(kid, 5));
        assertEq(proof.completionCount(kid), 1);
    }
}
