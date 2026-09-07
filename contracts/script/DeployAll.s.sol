// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {FutureKidsIdentity} from "../src/FutureKidsIdentity.sol";
import {AchievementBadge} from "../src/AchievementBadge.sol";
import {LearningProof} from "../src/LearningProof.sol";
import {ContributionRegistry} from "../src/ContributionRegistry.sol";

/// @title DeployAll
/// @notice One-command deployment of the Future Kids contract suite, with
///         chapter answers configured and all addresses logged.
///
/// Usage (Sepolia example):
///   export PRIVATE_KEY=0x...
///   export SEPOLIA_RPC_URL=https://rpc.sepolia.org
///   forge script script/DeployAll.s.sol:DeployAll \
///     --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
contract DeployAll is Script {
    function run()
        public
        returns (LearningProof proof, FutureKidsIdentity identity, AchievementBadge badge, ContributionRegistry registry)
    {
        string memory identityBaseUri = vm.envOr("IDENTITY_BASE_URI", string("ipfs://REPLACE_WITH_IDENTITY_CID/"));
        string memory badgeBaseUri = vm.envOr("BADGE_BASE_URI", string("ipfs://REPLACE_WITH_BADGES_CID/"));

        vm.startBroadcast();

        // 1) Learning history first: identity and badges depend on it.
        proof = new LearningProof(msg.sender);

        // 2) Anonymous identity.
        identity = new FutureKidsIdentity(address(proof), identityBaseUri);

        // 3) Soulbound achievement badges (proof-gated).
        badge = new AchievementBadge(address(proof), badgeBaseUri);

        // 4) Open-source contribution registry.
        registry = new ContributionRegistry(msg.sender);

        // 5) Configure the on-chain chapter answers (public by design:
        //    the answer IS the lesson).
        proof.setChapterAnswerHash(1, keccak256(abi.encodePacked(vm.envOr("CHAPTER1_ANSWER", string("trust")))));
        proof.setChapterAnswerHash(2, keccak256(abi.encodePacked(vm.envOr("CHAPTER2_ANSWER", string(unicode"2100万")))));
        proof.setChapterAnswerHash(3, keccak256(abi.encodePacked(vm.envOr("CHAPTER3_ANSWER", string("proof-of-work")))));
        proof.setChapterAnswerHash(4, keccak256(abi.encodePacked(vm.envOr("CHAPTER4_ANSWER", string("proof-of-stake")))));
        proof.setChapterAnswerHash(5, keccak256(abi.encodePacked(vm.envOr("CHAPTER5_ANSWER", string("smart-contract")))));

        vm.stopBroadcast();

        console2.log("=== Future Kids deployed ===");
        console2.log("LearningProof:        ", address(proof));
        console2.log("FutureKidsIdentity:   ", address(identity));
        console2.log("AchievementBadge:     ", address(badge));
        console2.log("ContributionRegistry: ", address(registry));
        console2.log("Deployer/admin:       ", msg.sender);
    }
}
