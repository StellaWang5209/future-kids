"use client";

import React from "react";
import { useAccount } from "wagmi";
import { BADGES, CHAPTERS, LEVELS, levelForChapters } from "@/lib/chapters";
import { useProgress } from "@/lib/progress";
import { contractAddresses, contractsConfigured } from "@/lib/wagmi";

/**
 * 「我的未来成长记录」— NOT "my assets".
 *
 * A growth story: level, a wall of soulbound badges, and a timeline of
 * learning proofs. Each entry can carry an on-chain tx hash that anyone
 * can independently verify.
 */
export function GrowthMap({
  onBack,
  onEnterChapter,
}: {
  onBack?: () => void;
  onEnterChapter?: (chapterId: number) => void;
}) {
  const { progress } = useProgress();
  const { address, chain } = useAccount();

  const done = CHAPTERS.filter((c) => progress.chapters[c.id]);
  const count = done.length;
  const level = levelForChapters(count);
  const nextLevel = LEVELS.find((l) => l.min > count);

  return (
    <div className="growth">
      <header className="growth-header">
        {onBack && (
          <button className="btn btn-ghost" onClick={onBack}>
            ← 返回星球地图
          </button>
        )}
        <h1>我的未来成长记录</h1>
        <p className="growth-sub">不是资产清单，而是一份可以永远保存的学习故事。</p>
      </header>

      <section className="growth-level card">
        <div className="level-emoji">{level.emoji}</div>
        <div className="level-info">
          <div className="level-name">当前等级：{level.name}</div>
          <div className="level-bar">
            <div className="level-fill" style={{ width: `${(count / CHAPTERS.length) * 100}%` }} />
          </div>
          <div className="level-next">
            {nextLevel
              ? `完成 ${nextLevel.min - count} 个新世界 → ${nextLevel.name}`
              : count >= CHAPTERS.length
                ? "🎉 太棒了！你点亮了未来星球的所有世界！"
                : "🛡️ 你已是最高等级守护者 —— 但新的世界仍在等你探索！"}
          </div>
        </div>
      </section>

      <section className="growth-badges">
        <h2>🎖️ 徽章墙（Soulbound · 不可转让）</h2>
        <div className="badge-grid">
          {BADGES.map((b) => {
            const ch = progress.chapters[b.chapterId];
            const earned = Boolean(ch);
            const chapter = CHAPTERS.find((c) => c.id === b.chapterId)!;
            return (
              <button
                key={b.type}
                className={`badge-card ${earned ? "earned" : "locked"}`}
                style={{ ["--pc" as string]: chapter.color }}
                onClick={() => (earned ? undefined : onEnterChapter?.(b.chapterId))}
                title={earned ? "已获得" : "去完成这一章"}
              >
                <div className="badge-emoji">{earned ? b.emoji : "❔"}</div>
                <div className="badge-name">{b.name}</div>
                <div className="badge-status">{earned ? "已点亮" : "未解锁"}</div>
                {ch?.badgeTx && (
                  <a
                    className="link"
                    href={`https://sepolia.etherscan.io/tx/${ch.badgeTx}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    链上凭证 ↗
                  </a>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="growth-timeline">
        <h2>📜 学习证明时间线</h2>
        {done.length === 0 ? (
          <p className="timeline-empty">还没有记录 —— 去第一个世界开始冒险吧！</p>
        ) : (
          <ol className="timeline">
            {done.map((c) => {
              const p = progress.chapters[c.id]!;
              return (
                <li key={c.id} className="timeline-item" style={{ ["--pc" as string]: c.color }}>
                  <div className="timeline-dot">{c.emoji}</div>
                  <div className="timeline-body">
                    <div className="timeline-title">{c.title}</div>
                    <div className="timeline-meta">
                      {new Date(p.completedAt).toLocaleString("zh-CN")} ·{" "}
                      {p.demo ? "本地记录" : `链上记录${p.proofTx ? "" : "（进行中）"}`}
                    </div>
                    {p.proofTx && (
                      <a
                        className="link"
                        href={`https://sepolia.etherscan.io/tx/${p.proofTx}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        学习证明交易 ↗
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="growth-chain card">
        <h2>⛓️ 链上身份</h2>
        {contractsConfigured ? (
          address ? (
            <p>
              钱包 <code>{address.slice(0, 6)}…{address.slice(-4)}</code>
              {chain ? `（${chain.name}）` : ""} 上的记录全球可验证、任何人可审计 —— 且不包含任何真实个人信息。
            </p>
          ) : (
            <p>连接监护人钱包后，同样的旅程会被写入以太坊公开账本。</p>
          )
        ) : (
          <p>
            本地模式：进度保存在这台设备上。部署合约并配置
            <code> NEXT_PUBLIC_*_ADDRESS </code>
            环境变量后，成长记录可以同步上链。
          </p>
        )}
        {!contractsConfigured && contractAddresses.proof === "" && (
          <p className="growth-note">这是公共物品的默认体验：先学习，上链是可选的一步。</p>
        )}
      </section>
    </div>
  );
}
