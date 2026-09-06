-- Future Kids — PostgreSQL read-model schema.
--
-- The Ethereum chain is the source of truth; these tables are a
-- convenience mirror (an indexer populates them from contract events).
-- NO personal information is ever stored here — only addresses,
-- pseudonyms, and on-chain facts.

CREATE TABLE IF NOT EXISTS learners (
    address      TEXT PRIMARY KEY,           -- wallet address (lowercase)
    pseudonym    TEXT NOT NULL,              -- the child's chosen pseudonym (on-chain data)
    token_id     BIGINT,                     -- FutureKidsIdentity tokenId
    level        SMALLINT NOT NULL DEFAULT 0,-- 0 Seed … 4 Guardian
    first_seen   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS completions (
    id            BIGSERIAL PRIMARY KEY,
    learner       TEXT NOT NULL REFERENCES learners(address),
    chapter_id    SMALLINT NOT NULL CHECK (chapter_id BETWEEN 1 AND 99),
    kind          SMALLINT NOT NULL,        -- 0 chapter, 1 challenge, 2 badge (mirrors ProofKind)
    tx_hash       TEXT NOT NULL,
    block_number  BIGINT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (learner, chapter_id, kind)
);
CREATE INDEX IF NOT EXISTS idx_completions_recent
    ON completions (block_number DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS badges (
    id            BIGSERIAL PRIMARY KEY,
    learner       TEXT NOT NULL REFERENCES learners(address),
    badge_type    SMALLINT NOT NULL CHECK (badge_type BETWEEN 0 AND 3),
    token_id      BIGINT NOT NULL UNIQUE,
    tx_hash       TEXT NOT NULL,
    block_number  BIGINT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (learner, badge_type)            -- one badge per type (contract enforces too)
);

CREATE TABLE IF NOT EXISTS contributions (
    id            BIGSERIAL PRIMARY KEY,
    contributor   TEXT NOT NULL,            -- address, may exist without identity
    category      SMALLINT NOT NULL,        -- 0 Code, 1 Translation, 2 Education, 3 Design, 4 Community
    points        INTEGER NOT NULL CHECK (points > 0),
    uri           TEXT,                     -- metadata pointer (IPFS), ≤256 chars on-chain
    tx_hash       TEXT NOT NULL,
    block_number  BIGINT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contributions_contributor
    ON contributions (contributor, created_at DESC);
