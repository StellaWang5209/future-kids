"use client";

import React, { useState } from "react";
import type { Chapter } from "@/lib/chapters";
import { Quiz } from "@/components/Quiz";

/**
 * Chapter 2 — Bitcoin World: "Star Mining Camp" (星星矿场)
 * Stage 1: story cards about Satoshi, the 21M cap, mining.
 * Stage 2: matching game — connect terms to meanings.
 * Stage 3: quiz.
 */

const PAIRS = [
  { left: "⛏️ 矿工", right: "用计算机守护网络的人" },
  { left: "✂️ 减半", right: "大约每 4 年，挖矿奖励减少一半" },
  { left: "2100 万", right: "比特币的总量上限" },
  { left: "🔑 哈希", right: "每笔交易独一无二的指纹" },
];

const STORY_CARDS = [
  { emoji: "🕰️", text: "2008 年 10 月 31 日，一位化名「中本聪」的人发布了比特币白皮书。" },
  { emoji: "💎", text: "规则写死在代码里：总量永远只有 2100 万枚，谁也不能偷偷多印。" },
  { emoji: "🌍", text: "没有银行、没有总部，全世界任何人都可以参与验证。" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function BitcoinGame({ chapter, onComplete }: { chapter: Chapter; onComplete: () => void }) {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [card, setCard] = useState(0);

  // matching game state
  const [rights] = useState(() => shuffle(PAIRS.map((p) => p.right)));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [solved, setSolved] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);

  function pickLeft(i: number) {
    if (solved.includes(i)) return;
    setSelectedLeft(i);
  }

  function pickRight(right: string) {
    if (selectedLeft === null) return;
    if (PAIRS[selectedLeft].right === right) {
      const ns = [...solved, selectedLeft];
      setSolved(ns);
      setSelectedLeft(null);
      if (ns.length === PAIRS.length) {
        setTimeout(() => setStage(3), 700);
      }
    } else {
      setMisses((m) => m + 1);
      setSelectedLeft(null);
    }
  }

  if (stage === 1) {
    return (
      <div>
        <h3 className="game-title">✨ 第一幕：星星矿场的故事</h3>
        <div className="story-card" style={{ borderColor: chapter.color }}>
          <div className="story-emoji">{STORY_CARDS[card].emoji}</div>
          <div className="story-text">{STORY_CARDS[card].text}</div>
        </div>
        <div className="game-actions">
          {card < STORY_CARDS.length - 1 ? (
            <button className="btn" style={{ background: chapter.color }} onClick={() => setCard(card + 1)}>
              下一页 →
            </button>
          ) : (
            <button className="btn" style={{ background: chapter.color }} onClick={() => setStage(2)}>
              开始配对挑战 →
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stage === 2) {
    const allSolved = solved.length === PAIRS.length;
    return (
      <div>
        <h3 className="game-title">🧩 第二幕：比特币概念配对</h3>
        <p className="game-desc">先点左边的词语，再点右边正确的解释。连错也没关系，探索就是学习！</p>
        <div className="match-grid">
          <div className="match-col">
            {PAIRS.map((p, i) => (
              <button
                key={i}
                className={`match-card left ${solved.includes(i) ? "solved" : ""} ${
                  selectedLeft === i ? "active" : ""
                }`}
                onClick={() => pickLeft(i)}
              >
                {p.left}
              </button>
            ))}
          </div>
          <div className="match-col">
            {rights.map((r, i) => (
              <button
                key={i}
                className={`match-card right ${
                  solved.some((si) => PAIRS[si].right === r) ? "solved" : ""
                }`}
                onClick={() => pickRight(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        {misses > 0 && <p className="match-misses">💫 试了 {misses} 次 —— 没关系，继续！</p>}
        {allSolved && <p className="match-misses">🎉 全部配对成功！</p>}
      </div>
    );
  }

  return (
    <div>
      <h3 className="game-title">🧠 第三幕：比特币小先锋问答</h3>
      <Quiz questions={chapter.quiz} accent={chapter.color} onAllCorrect={onComplete} />
    </div>
  );
}

export default BitcoinGame;
