// SPDX-License-Identifier: MIT
//
// verify-local.mjs — End-to-end local verification for the Future Kids suite.
//
// Mirrors the Foundry test-suite assertions using a Node-only toolchain so the
// whole journey can be verified without the Rust/Foundry toolchain (useful in
// restricted sandboxes and CI runners without Foundry):
//   compile ....... solc-js (same 0.8.26 compiler, WASM)
//   chain ......... ganache in-process EVM
//   deploy/test ... ethers v6
//
// Run:  cd contracts && node scripts/verify-local.mjs

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const solc = require("solc");
const ganache = require("ganache");
const { ethers } = require("ethers");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

// ---------------------------------------------------------------- utilities

const passed = [];
const failed = [];

function assertEq(actual, expected, label) {
    const norm = (v) => (typeof v === "bigint" ? v.toString() : v);
    const a = norm(actual);
    const b = norm(expected);
    if (a !== b) throw new Error(`assert failed [${label}]: expected ${b}, got ${a}`);
}

function assertTrue(value, label) {
    if (!value) throw new Error(`assert failed [${label}]: expected true, got ${value}`);
}

async function expectRevert(promise, label) {
    let reverted = false;
    try {
        await promise;
    } catch {
        reverted = true;
    }
    if (!reverted) throw new Error(`expected revert but call succeeded [${label}]`);
}

async function check(name, fn) {
    try {
        await fn();
        console.log(`   PASS  ${name}`);
        passed.push(name);
    } catch (e) {
        console.log(`   FAIL  ${name}\n         ${(e && e.message) || e}`);
        failed.push(name);
    }
}

// ------------------------------------------------- flatten (resolve imports)

const IMPORT_RE = /import\s+(?:\{[^}]+\}\s*from\s*|[^;"]*"?[^;"]*"?\s+from\s*)?"([^"]+)"\s*;/;

function flattenFile(absPath, visited, out) {
    const real = fs.realpathSync(absPath);
    if (visited.has(real)) return;
    visited.add(real);

    const source = fs.readFileSync(real, "utf8");
    const lines = source.split("\n");
    const own = [];

    for (const line of lines) {
        const m = line.match(IMPORT_RE);
        if (m) {
            const spec = m[1];
            let dep;
            if (spec.startsWith(".")) {
                dep = path.resolve(path.dirname(real), spec);
            } else {
                dep = path.join(ROOT, "node_modules", spec);
            }
            flattenFile(dep, visited, out);
            continue; // drop the import line; bodies are emitted dependency-first
        }
        // keep only the first pragma / SPDX banner to avoid noise
        own.push(line);
    }

    const filtered = own.filter((l) => !/^\s*pragma\s+solidity/.test(l));
    if (out.length === 0) out.push(filtered.join("\n"));
    else out.push(filtered.join("\n"));
}

function flatten(mainPath) {
    const visited = new Set();
    const chunks = [];
    // Emit SPDX+pragma banner once, then all bodies.
    const banner = "// SPDX-License-Identifier: MIT\npragma solidity 0.8.26;\n";
    flattenFile(mainPath, visited, chunks);
    // Chunks are emitted dependency-first, so the "first" chunk is a
    // dependency, not the main file. Strip SPDX banners from ALL chunks —
    // the single banner is prepended below.
    const body = chunks
        .map((c) => c.replace(/^\s*\/\/\s*SPDX-License-Identifier:.*$/gm, ""))
        .join("\n\n");
    return banner + "\n" + body;
}

// ------------------------------------------------------------------ compile

function compile() {
    const units = {
        LearningProof: path.join(SRC, "LearningProof.sol"),
        FutureKidsIdentity: path.join(SRC, "FutureKidsIdentity.sol"),
        AchievementBadge: path.join(SRC, "AchievementBadge.sol"),
        ContributionRegistry: path.join(SRC, "ContributionRegistry.sol"),
    };

    const sources = {};
    for (const [name, file] of Object.entries(units)) {
        sources[`${name}_flat.sol`] = { content: flatten(file) };
    }

    const input = {
        language: "Solidity",
        sources,
        settings: {
            optimizer: { enabled: true, runs: 200 },
            evmVersion: "shanghai",
            outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const errors = (output.errors || []).filter((e) => e.severity === "error");
    if (errors.length) {
        console.error("SOLC COMPILE ERRORS:");
        for (const e of errors) console.error("  " + e.formattedMessage);
        process.exit(1);
    }
    const warnings = (output.errors || []).filter((e) => e.severity === "warning");
    if (warnings.length) {
        console.log(`(compiler warnings: ${warnings.length})`);
    }

    const artifacts = {};
    for (const name of Object.keys(units)) {
        const c = output.contracts[`${name}_flat.sol`][name];
        artifacts[name] = { abi: c.abi, bytecode: "0x" + c.evm.bytecode.object };
    }
    return artifacts;
}

// --------------------------------------------------------------- chain setup

async function deploy(artifacts) {
    const gProvider = ganache.provider({ logging: { quiet: true } });
    const provider = new ethers.BrowserProvider(gProvider, { name: "ganache", chainId: 1337 });
    const deployer = await provider.getSigner(0);
    const kid = await provider.getSigner(1);
    const kid2 = await provider.getSigner(2);
    const stranger = await provider.getSigner(3);
    const kid3 = await provider.getSigner(4); // fresh learner for negative-gating tests

    async function deployContract(name, ...args) {
        const factory = new ethers.ContractFactory(artifacts[name].abi, artifacts[name].bytecode, deployer);
        const contract = await factory.deploy(...args);
        await contract.waitForDeployment();
        return contract;
    }

    const proof = await deployContract("LearningProof", deployer.address);
    const identity = await deployContract("FutureKidsIdentity", proof.target, "ipfs://identity-metadata/");
    const badge = await deployContract("AchievementBadge", proof.target, "ipfs://badge-metadata/");
    const registry = await deployContract("ContributionRegistry", deployer.address);

    // Chapter answers (public by design: the answer IS the lesson).
    const answers = ["trust", "2100万", "proof-of-work", "proof-of-stake", "smart-contract"];
    for (let ch = 1; ch <= answers.length; ch++) {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(answers[ch - 1]));
        await (await proof.setChapterAnswerHash(ch, hash)).wait();
    }

    return { provider, deployer, kid, kid2, kid3, stranger, proof, identity, badge, registry, answers };
}

// -------------------------------------------------------------------- tests

async function runTests() {
    console.log("Compiling with solc-js 0.8.26 (optimizer on)...");
    const artifacts = compile();
    console.log("Compiled: " + Object.keys(artifacts).join(", "));

    console.log("Deploying to in-memory EVM (ganache)...");
    const S = await deploy(artifacts);
    const { kid, kid2, kid3, stranger, proof, identity, badge, registry } = S;

    const kidProof = proof.connect(kid);
    const kidIdentity = identity.connect(kid);
    const kidBadge = badge.connect(kid);
    const kid2Proof = proof.connect(kid2);
    const kid2Badge = badge.connect(kid2);
    const kid2Identity = identity.connect(kid2);
    const strangerBadge = badge.connect(stranger);
    const strangerIdentity = identity.connect(stranger);

    console.log("\n== LearningProof ==");

    await check("recordCompletion: wrong answer reverts", async () => {
        await expectRevert(kidProof.recordCompletion(1, "banana"), "wrong answer");
    });

    await check("recordCompletion: correct answer recorded on-chain", async () => {
        await (await kidProof.recordCompletion(1, "trust")).wait();
        assertTrue(await kidProof.hasCompleted(kid.address, 1), "hasCompleted");
        assertEq(await kidProof.completionCount(kid.address), 1n, "completionCount");
        assertEq(await kidProof.proofCount(kid.address), 1n, "proofCount");
        const p = await kidProof.getProof(kid.address, 0);
        assertEq(p.kind, 0n, "kind==Chapter");
    });

    await check("recordCompletion: cannot record the same chapter twice", async () => {
        await expectRevert(kidProof.recordCompletion(1, "trust"), "already completed");
    });

    await check("recordCompletion: unconfigured chapter reverts", async () => {
        await expectRevert(kidProof.recordCompletion(99, "trust"), "unconfigured");
    });

    await check("recordByRecorder: platform can append challenge proofs", async () => {
        const h = ethers.id("bonus-challenge-1");
        await (await proof.recordByRecorder(kid.address, 1, 1, h)).wait(); // 1 = Challenge
        assertEq(await kidProof.proofCount(kid.address), 2n, "proofCount");
    });

    console.log("\n== FutureKidsIdentity ==");

    await check("createIdentity: anonymous identity owned by the kid", async () => {
        const tokenId = await kidIdentity.createIdentity.staticCall("star-rider");
        await (await kidIdentity.createIdentity("star-rider")).wait();
        assertEq(tokenId, 1n, "tokenId==1");
        assertEq(await identity.identityOf(kid.address), 1n, "identityOf");
        assertEq(await identity.pseudonymOf(1), "star-rider", "pseudonym");
        assertEq(await identity.levelOf(1), 0n, "level==Seed");
        assertEq(await identity.totalIdentities(), 1n, "totalIdentities");
        assertEq(await identity.tokenURI(1), "ipfs://identity-metadata/1.json", "tokenURI");
    });

    await check("createIdentity: one identity per learner", async () => {
        await expectRevert(kidIdentity.createIdentity("again"), "already has identity");
    });

    await check("createIdentity: pseudonym validation", async () => {
        await expectRevert(kid2Identity.createIdentity(""), "empty pseudonym");
        await expectRevert(kid2Identity.createIdentity("this-pseudonym-is-definitely-too-long-x"), ">32 bytes");
    });

    await check("ERC-5192: identity is locked (soulbound)", async () => {
        assertEq(await identity.locked(1), true, "locked");
        assertTrue(await identity.supportsInterface("0xb45a3c0e"), "supports ERC5192");
    });

    await check("soulbound: identity cannot be transferred", async () => {
        await expectRevert(
            kidIdentity.transferFrom(kid.address, stranger.address, 1),
            "transfer identity"
        );
    });

    await check("levelUp: gated by proven chapters", async () => {
        // kid already has 1 proven chapter at this point — use a fresh learner
        await (await identity.connect(kid3).createIdentity("late-comer")).wait();
        await expectRevert(identity.connect(kid3).levelUp(), "no proof yet");
    });

    console.log("\n== AchievementBadge ==");

    await check("mint: reverts without on-chain proof", async () => {
        await expectRevert(badge.connect(kid3).mint(0), "no proof");
    });

    await check("mint: Blockchain Explorer badge after Chapter 1", async () => {
        await (await kidBadge.mint(0)).wait();
        assertTrue(await badge.hasBadge(kid.address, 0), "hasBadge");
        assertEq(await badge.balanceOf(kid.address), 1n, "balance");
        assertEq(await badge.ownerOf(1), kid.address, "owner");
        assertEq(await badge.badgeTypeOf(1), 0n, "badgeType");
        assertEq(await badge.totalBadgesMinted(), 1n, "totalMinted");
        assertEq(await badge.badgeName(0), "Blockchain Explorer", "badgeName");
        assertEq(await badge.tokenURI(1), "ipfs://badge-metadata/1.json", "tokenURI");
    });

    await check("mint: duplicate badge reverts, balance stays 1", async () => {
        await expectRevert(kidBadge.mint(0), "already earned");
        assertEq(await badge.balanceOf(kid.address), 1n, "still one");
    });

    await check("soulbound: badge cannot be transferred or sold", async () => {
        assertEq(await badge.locked(1), true, "locked");
        await expectRevert(kidBadge.transferFrom(kid.address, stranger.address, 1), "transfer badge");
        await expectRevert(strangerBadge.transferFrom(kid.address, stranger.address, 1), "transfer by stranger");
    });

    await check("mintTo: platform path still requires proof", async () => {
        await expectRevert(badge.mintTo(kid2.address, 1), "platform mint without proof");
    });

    await check("mintTo: platform mints after proof (embedded-wallet journey)", async () => {
        await (await kid2Proof.recordCompletion(2, "2100万")).wait();
        await (await badge.mintTo(kid2.address, 1)).wait(); // Bitcoin Pioneer
        assertTrue(await badge.hasBadge(kid2.address, 1), "hasBadge");
        assertEq(await badge.ownerOf(2), kid2.address, "owner");
        assertEq(await badge.badgeName(1), "Bitcoin Pioneer", "badgeName");
    });

    console.log("\n== FutureKidsIdentity: growth ==");

    await check("levelUp: Sprout after 1 proven chapter", async () => {
        await (await kidIdentity.levelUp()).wait(); // Seed -> Sprout
        assertEq(await identity.levelOf(1), 1n, "level==Sprout");
    });

    console.log("\n== ContributionRegistry ==");

    await check("recordContribution: role-gated, points accumulate", async () => {
        const h = ethers.id("pull-request-1");
        await (await registry.recordContribution(stranger.address, 0, h, "https://github.com/future-kids/pull/1", 10)).wait();
        assertEq(await registry.totalPoints(stranger.address), 10n, "totalPoints");
        assertEq(await registry.contributionCount(stranger.address), 1n, "count");
        assertEq(await registry.totalContributions(), 1n, "totalContributions");
        await expectRevert(
            registry.connect(kid).recordContribution(stranger.address, 0, h, "x", 1),
            "kid has no RECORDER_ROLE"
        );
    });

    console.log("\n== Integration: full Future Planet Adventure ==");

    await check("journey: chapters 2-5, badges, Seed -> Guardian", async () => {
        const answers = ["2100万", "proof-of-work", "proof-of-stake"];
        for (let i = 0; i < 3; i++) {
            const chapter = i + 2;
            await (await kidProof.recordCompletion(chapter, answers[i])).wait();
            await (await kidBadge.mint(chapter - 1)).wait(); // badge types 1..3
            await (await kidIdentity.levelUp()).wait();      // Explorer, Builder, Guardian
        }
        // Chapter 5 — Ethereum bonus world (level is capped at Guardian on-chain).
        await (await kidProof.recordCompletion(5, "smart-contract")).wait();
        await (await kidBadge.mint(4)).wait();               // Ethereum Builder
        assertEq(await identity.levelOf(1), 4n, "level==Guardian");
        assertEq(await badge.balanceOf(kid.address), 5n, "5 badges");
        assertEq(await proof.completionCount(kid.address), 5n, "5 chapters");
        assertEq(await proof.proofCount(kid.address), 6n, "5 chapters + 1 challenge");
        // kid owns tokens 1,3,4,5,6 (token 2 was minted to kid2 via mintTo)
        assertEq(await badge.ownerOf(2), kid2.address, "kid2 keeps Bitcoin Pioneer");
        for (const t of [1, 3, 4, 5, 6]) {
            assertEq(await badge.locked(t), true, `badge ${t} locked`);
            assertEq(await badge.ownerOf(t), kid.address, `badge ${t} owner`);
        }
    });

    // ---------------------------------------------------------------- summary
    console.log("\n==============================");
    console.log(`PASSED: ${passed.length}   FAILED: ${failed.length}`);
    if (failed.length) {
        console.log("Failed checks:");
        for (const f of failed) console.log("  - " + f);
        process.exit(1);
    }
    console.log("ALL CHECKS PASSED — Future Kids suite verified end-to-end.");
}

runTests().catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
});
