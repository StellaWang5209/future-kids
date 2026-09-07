# 开发者指南 · Developer Guide

**Future Kids — architecture, contract design, testing, deployment.**

---

## 1. Architecture overview

```
┌────────────────────────────  Frontend (Next.js 14)  ───────────────────────────┐
│  Demo Mode (default)          │  On-chain Mode (optional, guardian's wallet)   │
│  localStorage progress        │  wagmi v2 + viem + RainbowKit (ERC-4337 ready)  │
└──────────────┬────────────────┴───────────────────┬────────────────────────────┘
               │ no wallet needed                    │ JSON-RPC (Sepolia / local node)
┌──────────────▼─────────────────────────────────────▼────────────────────────────┐
│  Ethereum contracts (solc 0.8.26, OpenZeppelin v5)                              │
│  LearningProof ← FutureKidsIdentity (levels)                                    │
│        └─────────── AchievementBadge (proof-gated soulbound mints)              │
│  ContributionRegistry (open-source credits)                                     │
└──────────────┬──────────────────────────────────────────────────────────────────┘
               │ events (optional)
┌──────────────▼──────────────────────────────────────────────────────────────────┐
│  Backend: indexer + ERC-721 metadata service (Node.js + PostgreSQL + IPFS)      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Key decision: **the platform degrades gracefully**. With no backend and no wallet,
the full 5-chapter journey works (Demo Mode). Every on-chain feature is additive.

## 2. Contract design decisions

### 2.1 Soulbound = `_update()` override + ERC-5192

OpenZeppelin v5 removed `_beforeTokenTransfer`. The canonical v5 way to make an
ERC-721 non-transferable:

```solidity
function _update(address to, uint256 tokenId, address auth)
    internal override returns (address)
{
    address from = _ownerOf(tokenId);
    if (from != address(0) && to != address(0)) {
        revert Soulbound(); // mint (from==0) and burn (to==0) stay allowed
    }
    return super._update(to, tokenId, auth);
}
```

ERC-5192 compliance: `locked(uint256)` always returns `true`, `Locked(tokenId)`
is emitted at mint, and `supportsInterface` advertises `0xb45a3c0e`.

### 2.2 Proof-gated permissionless minting

`AchievementBadge.mint(badgeType)` is callable by anyone but requires
`LearningProof.hasCompleted(msg.sender, chapterForBadge(badgeType))` — nobody can
mint a badge they didn't earn, without needing a centralized minter. The platform
also holds `MINTER_ROLE` (`mintTo`) for embedded-wallet journeys; **both paths are
proof-gated**.

### 2.3 The answer IS the lesson

`LearningProof.recordCompletion(chapterId, answer)` hashes the submitted answer
against `chapterAnswerHash[chapterId]`. The answers are public (`trust`,
`2100万`, `proof-of-work`, `proof-of-stake`, `smart-contract`) — the challenge is
playing the chapter, not keeping a secret. This makes proofs verifiable and
replayable by anyone, forever.

### 2.4 Privacy by schema

No contract stores anything but: an address, a ≤32-byte pseudonym, a level, and
timestamps. There is no field anywhere in the system that could hold a real name,
birthday, or school. Privacy is enforced by the ABI itself.

### 2.5 Gas notes

Optimizer 200 runs. Storage is packed (`Proof` = 1 slot: uint64+bytes32... see
`struct Proof {uint64 timestamp; bytes32 challengeHash; ProofKind kind; uint8 chapterId}`).
Custom errors instead of revert strings. One-slot `Identity` struct.

## 3. Testing strategy

**Two layers:**

1. **Foundry suite** (`contracts/test/*.t.sol`) — 4 unit files + 1 integration file,
   run in CI and locally via `forge test`. Uses `forge-std`, precise custom-error
   selector assertions, fuzz test on answer recording.
2. **Local E2E** (`contracts/scripts/verify-local.mjs`) — for environments without
   Foundry. It flattens each contract (resolving `@openzeppelin/*` imports from
   node_modules), compiles with solc-js, deploys to an in-process ganache chain,
   and executes 20 E2E checks with ethers v6 — the exact journey a child takes.

```bash
cd contracts
npm run verify:local      # 20 checks: PASS/FAIL summary, exits 1 on failure
forge test -vvv           # if Foundry is installed
```

> Note: `verify-local.mjs` deliberately shares the answer constants with the
> frontend (`lib/chapters.ts`). If you change a chapter answer, update BOTH.

## 4. Deployment runbook (Sepolia)

```bash
cd contracts
# .env: SEPOLIA_RPC_URL=…  PRIVATE_KEY=<deployer, no child keys!> ETHERSCAN_API_KEY=…
forge script script/DeployAll.s.sol \
  --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
# The script deploys in order: LearningProof → FutureKidsIdentity →
# AchievementBadge → ContributionRegistry, configures chapter answer hashes,
# and prints all addresses.

# Frontend
echo "NEXT_PUBLIC_IDENTITY_ADDRESS=0x…"  >> frontend/.env.local
echo "NEXT_PUBLIC_PROOF_ADDRESS=0x…"     >> frontend/.env.local
echo "NEXT_PUBLIC_BADGE_ADDRESS=0x…"     >> frontend/.env.local
```

Deployment roles after launch: `DEFAULT_ADMIN_ROLE` → platform multisig (not an
EOA); `RECORDER_ROLE`/`MINTER_ROLE` → platform backend signer. The deployer key
must never be exposed to children — kids interact through embedded wallets
(ERC-4337 roadmap) or a guardian's wallet.

**Mainnet readiness checklist**: external audit of the 4 contracts, multisig
role transfer, answer-hash rotation procedure, gas snapshot, incident response
plan (pause is intentionally NOT included — see 2.2, proofs are permissionless;
if a bug is found, admin can only change answer hashes).

## 5. Frontend notes

- `lib/chapters.ts` is the single source of chapter content (story, quiz,
  answer, badge mapping) — shared with `verify-local.mjs` answers and the
  backend `/chapters` endpoint.
- `lib/progress.tsx` is a two-layer store: Demo (localStorage `fk-progress-v1`)
  and on-chain (tx hashes are remembered next to local progress).
- RainbowKit `projectId`: register a free project at cloud.walletconnect.com for
  production; a demo placeholder is used by default.
- Next 14 + React 18 + wagmi 2: keep `transpilePackages: ["@rainbow-me/rainbowkit"]`
  in `next.config.mjs`.

## 6. Contributing quick-start

```bash
git clone https://github.com/future-kids/future-kids
cd future-kids && cd frontend && npm install && npm run dev   # story first
cd ../contracts && npm install && npm run verify:local        # contracts second
```

Good first issues: translations (use `ContributionRegistry` category 1!), new
chapter worlds, accessibility passes, offline PWA. Please read the privacy
non-negotiables in section 2.4 before proposing schema/ABI changes.
