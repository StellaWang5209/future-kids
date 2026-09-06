# 🌍 Future Kids · 未来小孩

**A blockchain-native digital civilization education platform for children — open source, free, a public good.**
**面向全球儿童的链上数字文明教育平台 —— 开源、免费、公共物品。**

> We teach kids how the decentralized internet works, and give them a permanent,
> private, verifiable record of their learning. **This is not a financial product:
> no token, no NFT trading, no investment of any kind.**
>
> 我们教孩子理解去中心化互联网的原理，并给他们一份永久、私密、可验证的学习记录。
> **这不是金融产品：没有代币、没有 NFT 交易、没有任何投资属性。**

---

## ✦ What kids get / 孩子会得到什么

| | |
|---|---|
| 🪪 **A private digital identity** 数字身份 | A pseudonym + wallet address only. No real name, birthday, or school — privacy is written into the contracts. 只有化名与地址，不记录任何真实个人信息。 |
| 🎮 **Four story worlds** 四个故事世界 | Blockchain · Bitcoin · PoW · PoS, taught through interactive games. 通过互动游戏理解区块链、比特币、工作量证明与权益证明。 |
| 📜 **Learning proofs** 学习证明 | Completing a chapter records an on-chain proof (the chapter's "knowledge key" is hashed on-chain). 完成章节即在链上留下学习证明。 |
| 🎖️ **Soulbound badges** 灵魂绑定的徽章 | ERC-721 badges locked to the learner forever (ERC-5192). They cannot be sold or transferred — they mean *you learned it*. 永久绑定、不可转让、不可买卖 —— 徽章的意义是「你真的学会了」。 |
| 🗺️ **A growth map, not a wallet** 成长地图，而非资产页 | The UI says「我的未来成长记录」. There is no balance, no portfolio, no price. 界面只有成长记录，没有余额、没有行情。 |

## ✦ Architecture / 架构

```
future-kids/
├── contracts/        Solidity contracts + Foundry tests (OpenZeppelin, solc 0.8.26)
├── frontend/         Next.js 14 + wagmi v2 + RainbowKit (works with ZERO wallet — Demo Mode)
├── backend/          Optional indexer + ERC-721 metadata service (Node.js + PostgreSQL + IPFS)
├── docs/             Teacher guide · Developer guide
└── .github/          CI: build + test on every push
```

## ✦ Smart contracts / 智能合约

| Contract | Purpose | Key safety properties |
|---|---|---|
| `FutureKidsIdentity` | Pseudonymous learner identity NFT (levels: Seed → Guardian) | Soulbound (transfer reverts), one identity per address, ≤32-byte pseudonym, no PII fields |
| `LearningProof` | Permissionless chapter completion proofs, gated by answer hash | `nonReentrant`, one proof per (learner, chapter), answer-hash gated, recorder role for platform credits |
| `AchievementBadge` | ERC-721 soulbound achievement badges (ERC-5192) | Mint requires a prior `LearningProof` for the matching chapter; self-mint and role-mint paths both proof-gated |
| `ContributionRegistry` | Open-source contribution records (code, translation, education, design, community) | Recorder-role gated, input validation, points accounting |

All contracts: OpenZeppelin v5, `AccessControl`, `ReentrancyGuard`, custom errors, optimizer on. Full Foundry test suite in `contracts/test/` (unit + integration).

## ✦ Quick start / 快速开始

```bash
# 1. Frontend (Demo Mode needs nothing else)
cd frontend && npm install && npm run dev
# → http://localhost:3000 — the full 4-chapter journey, no wallet required

# 2. Contracts
cd contracts
npm install                 # OpenZeppelin, solc-js, ganache, ethers
npm run verify:local        # compile + deploy on an in-memory chain + 16 E2E checks
# Foundry (in CI / on your machine):
forge install foundry-rs/forge-std
forge build && forge test -vvv

# 3. On-chain mode (guardian's wallet)
#    Deploy to Sepolia, then set env vars for the frontend:
forge script script/DeployAll.s.sol --rpc-url $SEPOLIA_RPC --broadcast
#    frontend/.env.local:
#    NEXT_PUBLIC_IDENTITY_ADDRESS=0x…  NEXT_PUBLIC_PROOF_ADDRESS=0x…  NEXT_PUBLIC_BADGE_ADDRESS=0x…
```

## ✦ Kid-safe wallet philosophy / 儿童友好钱包理念

- **Demo Mode first**: the entire learning journey works with zero wallet, progress stored locally.
- **Guardian-held keys (roadmap)**: with ERC-4337 account abstraction, a parent/guardian controls the key; the child only ever sees a friendly profile. The child cannot sign anything financial — the contracts contain no transferable value.
- **No financialization, enforced by code**: soulbound locks make badges non-transferable at the EVM level. There is nothing to speculate on.

## ✦ For educators / 致教育者

See [docs/TEACHER_GUIDE.md](docs/TEACHER_GUIDE.md) — lesson plans, classroom flow, answer key, and how to run the platform offline.

## ✦ For developers / 致开发者

See [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) — architecture decisions, contract design, testing strategy, deployment runbook, and how to contribute.

## ✦ License / 许可

MIT © 2026 Future Kids Contributors. Free forever, fork-friendly.
