# Future Kids Backend · 可选索引与元数据服务

> **设计原则：以太坊链是唯一事实来源（source of truth）。**
> 本服务不铸徽章、不持私钥、不存储任何儿童个人信息。它只做两件事：
> 1. 把链上公开事件镜像进 PostgreSQL，提供友好查询（学习者成长摘要、最近证明流）；
> 2. 生成 ERC-721 元数据 JSON，供 IPFS pinning。
>
> 本服务宕机不影响平台 —— 前端直接与链交互。

## 运行

```bash
cp .env.example .env         # 配置 DATABASE_URL（可选）
npm install
npm run db:init              # 建表（需 psql）
npm start                    # 默认 :4000
```

## API

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | 服务状态（含 DB / RPC 配置情况） |
| GET | `/chapters` | 四章课程目录（含公开的知识钥匙） |
| GET | `/metadata/badge/:type` | 徽章 ERC-721 元数据（0..3），供 IPFS pin |
| GET | `/index/learner/:address` | 学习者成长摘要（匿名地址级） |
| GET | `/index/recent?limit=20` | 全网最近学习证明（公共物品透明度） |
| GET | `/ipfs/pin-instructions` | IPFS pinning 三步操作说明 |

## IPFS 元数据方案

合约 `tokenURI` 指向 `ipfs://<base>/<tokenId>.json`。元数据是静态小文件：

1. `curl localhost:4000/metadata/badge/0..3 > badge-{0..3}.json`
2. 用任意 provider pin（Pinata / web3.storage / 本地 Kubo）：`ipfs add badge-*.json`
3. 一次性管理交易把 `AchievementBadge` 的 baseURI 设为 `ipfs://<目录CID>/`

**隐私约束（硬性）**：元数据中只允许出现徽章名称、章节号、Soulbound 属性 ——
永远不得包含化名以外的任何与真实儿童相关的字段。

## 环境变量

| 变量 | 必需 | 说明 |
|---|---|---|
| `DATABASE_URL` | 否 | 未配置时索引 API 返回 503，其余功能正常 |
| `IPFS_GATEWAY` | 否 | 默认 `https://ipfs.io/ipfs/` |
| `BASE_TOKEN_URI` | 否 | 展示用默认 baseURI |
| `PORT` | 否 | 默认 4000 |
