import express from "express";
import cors from "cors";
import { Pool } from "pg";

/**
 * Future Kids — optional indexer & metadata service.
 *
 * DESIGN PRINCIPLE: the Ethereum chain is the single source of truth.
 * This service never mints, never holds keys, and never stores personal
 * information about children. It only:
 *   1. mirrors public contract events into PostgreSQL for friendly queries,
 *   2. builds ERC-721 metadata JSON for badges/identities (for IPFS pinning).
 *
 * If this service is down, the platform still works — the frontend talks to
 * the chain directly.
 */

const app = express();
app.use(cors());
app.use(express.json({ limit: "64kb" }));

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  : null;

const IPFS_GATEWAY = process.env.IPFS_GATEWAY ?? "https://ipfs.io/ipfs/";
const BASE_TOKEN_URI = process.env.BASE_TOKEN_URI ?? "ipfs://future-kids-metadata/";

// ---------------------------------------------------------------- health

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "future-kids-backend",
    db: Boolean(pool),
    chain: process.env.RPC_URL ?? "unset",
  });
});

// ------------------------------------------------- public chapter catalog

const CHAPTERS = [
  { id: 1, badgeType: 0, world: "Blockchain World", answer: "trust", title: "区块链世界 · 魔法记录本" },
  { id: 2, badgeType: 1, world: "Bitcoin World", answer: "2100万", title: "比特币世界 · 星星矿场" },
  { id: 3, badgeType: 2, world: "PoW World", answer: "proof-of-work", title: "PoW 世界 · 算力竞技场" },
  { id: 4, badgeType: 3, world: "PoS World", answer: "proof-of-stake", title: "PoS 世界 · 守护者城堡" },
];

app.get("/chapters", (_req, res) => res.json({ chapters: CHAPTERS }));

// -------------------------------------------------------- ERC-721 metadata
/**
 * Badge metadata builder — deterministic, offline-verifiable.
 * The frontend (or any script) can pin this JSON to IPFS; the contract's
 * tokenURI points at {base}{tokenId}.json.
 *
 * NOTE: no child-identifying fields, ever. Name = badge name only.
 */
app.get("/metadata/badge/:badgeType", (req, res) => {
  const type = Number(req.params.badgeType);
  const badges = [
    { name: "Blockchain Explorer", nameZh: "区块链探险家", description: "Completed Chapter 1: understood blocks, hashes and decentralization.", chapterId: 1 },
    { name: "Bitcoin Pioneer", nameZh: "比特币先锋", description: "Completed Chapter 2: understood Bitcoin's 21 million cap and halving.", chapterId: 2 },
    { name: "PoW Builder", nameZh: "PoW 建造者", description: "Completed Chapter 3: understood Proof of Work, mining and its energy cost.", chapterId: 3 },
    { name: "PoS Guardian", nameZh: "PoS 守护者", description: "Completed Chapter 4: understood Proof of Stake, staking and slashing.", chapterId: 4 },
  ];
  const b = badges[type];
  if (!b) return res.status(404).json({ error: "unknown badgeType" });
  res.json({
    name: `Future Kids · ${b.name} (${b.nameZh})`,
    description: `${b.description} This is a soulbound achievement badge (ERC-5192): permanently bound, non-transferable, not a financial asset.`,
    external_url: "https://github.com/future-kids/future-kids",
    attributes: [
      { trait_type: "Chapter", value: b.chapterId },
      { trait_type: "Badge Type", value: type },
      { trait_type: "Soulbound", value: true },
      { trait_type: "Transferable", value: false },
    ],
  });
});

// ------------------------------------------------------------ read models

/** Learner growth summary by wallet address (pseudonymous by design). */
app.get("/index/learner/:address", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DATABASE_URL not configured" });
  const { rows } = await pool.query(
    `SELECT l.address,
            l.pseudonym,
            count(c.id) FILTER (WHERE c.kind = 'chapter') AS chapters_completed,
            count(b.id) AS badges,
            max(c.created_at) AS last_activity
       FROM learners l
       LEFT JOIN completions c ON c.learner = l.address
       LEFT JOIN badges b ON b.learner = l.address
      WHERE l.address = $1
      GROUP BY l.address, l.pseudonym`,
    [req.params.address.toLowerCase()]
  );
  if (!rows.length) return res.status(404).json({ error: "learner not indexed" });
  res.json(rows[0]);
});

/** Recent learning proofs across the platform (public-good transparency). */
app.get("/index/recent", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DATABASE_URL not configured" });
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { rows } = await pool.query(
    `SELECT learner, chapter_id, tx_hash, block_number, created_at
       FROM completions
      WHERE kind = 'chapter'
      ORDER BY block_number DESC, created_at DESC
      LIMIT $1`,
    [limit]
  );
  res.json({ items: rows });
});

// ------------------------------------------------------------- IPFS notes
/**
 * Pinning workflow (see README):
 *   1. curl /metadata/badge/0..3 > badge-{0..3}.json
 *   2. pin with your provider (web3.storage / Pinata / local Kubo):
 *        ipfs add badge-*.json
 *   3. set contract baseURI to ipfs://<dirCID>/ (or per-token CID)
 * Metadata is static and tiny; pinning is permissionless and free-tier friendly.
 */
app.get("/ipfs/pin-instructions", (_req, res) => {
  res.json({
    gateway: IPFS_GATEWAY,
    baseTokenUri: BASE_TOKEN_URI,
    steps: [
      "GET /metadata/badge/:type for each badge type and save as badge-{type}.json",
      "Pin the JSON files to IPFS (Pinata, web3.storage, or a local Kubo node)",
      "Set AchievementBadge.baseTokenURI to ipfs://<CID>/ in a one-time admin tx",
    ],
  });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`Future Kids backend listening on :${port}`));
