"use client";

import Link from "next/link";

/**
 * 关于未来星球 — mission, promises, teacher corner, roadmap, developers.
 */

const PROMISES = [
  {
    emoji: "🆓",
    title: "永远免费 + 开源",
    body: "MIT 许可证，代码全部公开。任何人都可以运行、修改、把它带到自己的课堂 —— 无需许可。",
  },
  {
    emoji: "🔒",
    title: "隐私默认",
    body: "链上身份是匿名的：只有一个钱包地址和一个昵称。我们不收集、也不存储任何姓名、生日或学校信息。",
  },
  {
    emoji: "🚫",
    title: "绝不金融化",
    body: "没有代币，没有 NFT 交易，没有投资。徽章是 Soulbound —— 只能靠学习获得，永远无法买卖。",
  },
];

const ROADMAP = [
  { emoji: "🌐", name: "Ethereum 世界", status: "已上线", desc: "智能合约是怎么运行的？Gas、EVM 与去中心化应用 —— 现在就去第 5 站亲自搭建一台合约售货机！" },
  { emoji: "📦", name: "IPFS 星环", status: "规划中", desc: "文件不放在一台服务器上，也能永远存在？" },
  { emoji: "🏛️", name: "DAO 广场", status: "规划中", desc: "一群互不相识的人，如何一起做决定？" },
  { emoji: "🛡️", name: "Guardian 模式", status: "研究中", desc: "基于 ERC-4337 账户抽象：家长作为守护人，帮孩子安全地管理链上身份。" },
  { emoji: "🗣️", name: "多语言星球", status: "长期", desc: "每一章课程都会由社区翻译成更多语言。" },
];

const LESSON = [
  "课前（10 分钟）：问孩子「你画的一幅画，怎么证明是你画的？」",
  "课中（25 分钟）：孩子自己玩完一个星球的冒险（教师只需陪伴，不需要懂区块链）；",
  "互动（5 分钟）：一起做「篡改实验」，让孩子给你讲解为什么历史改不动；",
  "课后：用「成长记录」页回顾，鼓励孩子在贡献者大厅提交一个课堂贡献。",
];

export default function AboutPage() {
  return (
    <main className="page">
      <header className="page-hero">
        <h1 className="page-title">💡 关于未来星球</h1>
        <p className="page-sub">
          我们相信：理解数字文明的规则，是这一代孩子的读写能力。
          未来星球把区块链的核心思想变成一场安全的冒险 —— 然后把冒险的证明，永远写在人类自己的公共账本上。
        </p>
      </header>

      <section className="promise-grid">
        {PROMISES.map((p) => (
          <div key={p.title} className="promise-card card">
            <div className="promise-emoji">{p.emoji}</div>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
          </div>
        ))}
      </section>

      <section className="card teacher-box">
        <h2>🏫 教师角</h2>
        <p>
          完整的课堂指南在仓库 <code>docs/TEACHER_GUIDE.md</code>。快速版 45 分钟教案：
        </p>
        <ol className="lesson-steps">
          {LESSON.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <p className="teacher-note">
          💡 孩子全程不需要钱包、不需要注册、不输入任何个人信息 —— Demo 模式就是课堂模式。
        </p>
      </section>

      <section className="card">
        <h2>🗺️ 星际航线图</h2>
        <ul className="roadmap-list">
          {ROADMAP.map((r) => (
            <li key={r.name} className="roadmap-item">
              <span className="roadmap-emoji">{r.emoji}</span>
              <div className="roadmap-info">
                <b>{r.name}</b>
                <span className="roadmap-desc">{r.desc}</span>
              </div>
              <span className="status-pill">{r.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>🛠️ 开发者</h2>
        <p>
          仓库结构：<code>contracts/</code>（4 个 Solidity 合约 + Foundry 测试）、<code>frontend/</code>（Next.js 14 + wagmi v2，5 章互动课程）、
          <code>backend/</code>（索引与元数据服务）、<code>docs/</code>（双语指南）。CI 自动跑全套合约测试。
        </p>
        <p>
          想让它更好？欢迎在 <Link href="/contributors" className="link">贡献者大厅</Link> 提交你的第一份贡献，
          或阅读 <code>CONTRIBUTING.md</code> 与 <code>docs/DEVELOPER_GUIDE.md</code>。
        </p>
      </section>

      <footer className="landing-footer">
        未来小孩 Future Kids · 开源公共物品 · MIT License · 不是金融产品，没有代币，没有投资
      </footer>
    </main>
  );
}
