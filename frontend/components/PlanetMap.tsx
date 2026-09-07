"use client";

import React from "react";
import { CHAPTERS, type Chapter } from "@/lib/chapters";
import { useProgress } from "@/lib/progress";

/**
 * The Future Planet map: four worlds along a star path.
 * A world unlocks when the previous one is completed — journey order matters,
 * because the story builds from blocks → Bitcoin → PoW → PoS.
 */
export function PlanetMap({
  onEnterChapter,
  onOpenGrowth,
}: {
  onEnterChapter: (chapter: Chapter) => void;
  onOpenGrowth: () => void;
}) {
  const { progress, resetAll } = useProgress();
  const identity = progress.identity;
  const completed = (id: number) => Boolean(progress.chapters[id]);
  const count = CHAPTERS.filter((c) => completed(c.id)).length;

  function isUnlocked(chapter: Chapter): boolean {
    if (chapter.id === 1) return true;
    return completed(chapter.id - 1);
  }

  return (
    <div className="planet-map">
      <header className="map-header">
        <div className="map-kid">
          <span className="map-avatar">{identity?.avatar ?? "🌟"}</span>
          <div>
            <div className="map-name">{identity?.pseudonym ?? "小探险家"}</div>
            <div className="map-stats">
              已点亮 {count}/{CHAPTERS.length} 个星球 ·{" "}
              {count === CHAPTERS.length ? "全图点亮，太了不起 ✨" : "旅程继续…"}
            </div>
          </div>
        </div>
        <div className="map-actions">
          <button className="btn" onClick={onOpenGrowth}>
            🗺️ 我的未来成长记录
          </button>
          <button className="btn btn-ghost" onClick={resetAll} title="清除本地进度（链上记录无法清除，这正是区块链的意义）">
            ↺ 重新开始
          </button>
        </div>
      </header>

      <h1 className="map-title">未来星球 Future Planet</h1>
      <p className="map-sub">沿着星路前进，每完成一个世界的挑战，就能点亮一颗星球。</p>

      <div className="planet-path">
        {CHAPTERS.map((ch, i) => {
          const unlocked = isUnlocked(ch);
          const done = completed(ch.id);
          const cls = `planet ${done ? "done" : ""} ${unlocked ? "open" : "locked"}`;
          return (
            <React.Fragment key={ch.id}>
              {i > 0 && <div className={`star-link ${done || completed(ch.id - 1) ? "lit" : ""}`}>✦</div>}
              <button className={cls} style={{ ["--pc" as string]: ch.color }} disabled={!unlocked} onClick={() => onEnterChapter(ch)}>
                <span className="planet-emoji">{done ? ch.emoji : unlocked ? ch.emoji : "🔒"}</span>
                <span className="planet-name">{ch.world}</span>
                <span className="planet-title">{ch.title}</span>
                <span className="planet-status">
                  {done ? "✓ 已点亮" : unlocked ? "▶ 进入冒险" : "完成上一站后解锁"}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <div className="roadmap-row">
        {[
          { emoji: "📦", name: "IPFS 星环", tag: "规划中" },
          { emoji: "🏛️", name: "DAO 广场", tag: "规划中" },
          { emoji: "✨", name: "更多世界", tag: "由你创造" },
        ].map((r) => (
          <div className="planet locked roadmap" key={r.name}>
            <span className="planet-emoji">{r.emoji}</span>
            <span className="planet-name">{r.name}</span>
            <span className="planet-title">敬请期待</span>
            <span className="planet-status">{r.tag}</span>
          </div>
        ))}
      </div>

      <div className="map-footer">
        <span className="map-hint">💡 没有钱包也能玩全部内容 —— 链上记录是可选的加分旅程。</span>
        <div className="map-links">
          <a className="btn btn-ghost" href="/contributors">
            🌟 贡献者大厅
          </a>
          <a className="btn btn-ghost" href="/about">
            💡 关于未来星球
          </a>
        </div>
      </div>
    </div>
  );
}
