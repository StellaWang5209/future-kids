// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ContributionRegistry} from "../src/ContributionRegistry.sol";

contract ContributionRegistryTest is Test {
    ContributionRegistry internal registry;
    address internal contributor;
    address internal stranger = makeAddr("stranger");

    function setUp() public {
        registry = new ContributionRegistry(address(this));
        contributor = makeAddr("contributor");
    }

    function test_RequiresRecorderRole() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                AccessControl.AccessControlUnauthorizedAccount.selector,
                stranger,
                registry.RECORDER_ROLE()
            )
        );
        registry.recordContribution(contributor, ContributionRegistry.Category.Code, keccak256("PR#1"), "https://github.com", 10);
    }

    function test_RecordContribution() public {
        bytes32 contentHash = keccak256("pull-request-1");
        registry.recordContribution(
            contributor,
            ContributionRegistry.Category.Code,
            contentHash,
            "https://github.com/future-kids/pull/1",
            10
        );

        assertEq(registry.totalPoints(contributor), 10);
        assertEq(registry.contributionCount(contributor), 1);
        assertEq(registry.totalContributions, 1);
        assertEq(
            registry.contributionsByCategory(ContributionRegistry.Category.Code),
            1
        );

        ContributionRegistry.Contribution memory c = registry.getContribution(contributor, 0);
        assertEq(uint8(c.category), uint8(ContributionRegistry.Category.Code));
        assertEq(uint256(c.contentHash), uint256(contentHash));
        assertEq(c.points, 10);
        assertEq(c.timestamp, uint64(block.timestamp));
    }

    function test_AccumulatesPointsAcrossCategories() public {
        registry.recordContribution(contributor, ContributionRegistry.Category.Translation, keccak256("zh-docs"), "ipfs://docs", 5);
        registry.recordContribution(contributor, ContributionRegistry.Category.Education, keccak256("lesson"), "ipfs://lesson", 7);

        assertEq(registry.totalPoints(contributor), 12);
        assertEq(registry.contributionCount(contributor), 2);
        assertEq(registry.getContributions(contributor).length, 2);
    }

    function test_ZeroPointsReverts() public {
        vm.expectRevert(ContributionRegistry.ZeroPoints.selector);
        registry.recordContribution(contributor, ContributionRegistry.Category.Design, keccak256("art"), "", 0);
    }

    function test_ZeroAddressReverts() public {
        vm.expectRevert(ContributionRegistry.InvalidContributor.selector);
        registry.recordContribution(address(0), ContributionRegistry.Category.Code, keccak256("x"), "", 1);
    }

    function test_UriTooLongReverts() public {
        bytes memory longUri = new bytes(257);
        for (uint256 i = 0; i < 257; i++) longUri[i] = "a";
        vm.expectRevert(ContributionRegistry.UriTooLong.selector);
        registry.recordContribution(contributor, ContributionRegistry.Category.Code, keccak256("x"), string(longUri), 1);
    }
}
