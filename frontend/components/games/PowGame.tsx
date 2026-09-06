"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Chapter } from "@/lib/chapters";
import { Quiz } from "@/components/Quiz";

/**
 * Chapter 3 — PoW World: "Hashpower Arena" (算力竞技场)
 * Stage 1: race two cartoon miners — kid clicks "计算!" to advance their hash
 *          attempts until the lucky nonce appears.
 * Stage 2: energy talk — honest math about cost & security.
 * Stage 3: quiz.
 */

const TARGET_TRIES = 8;

export function PowGame({ chapter, onComplete }: { chapter: Chapter; onComplete: () => void }) {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [tries, setTries] = useState(0);
  const [rival, setRival] = useState(0);
  const [nonce, setNonce] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stage !== 1 || nonce) return;
    timerRef.current = setInterval(() => {
      setRival((r) => Math.min(TARGET_TRIES - 2, r + 1));
    }, 1800);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, nonce]);

  useEffect(() => {
    if (nonce && timerRef.current) clearInterval(timerRef.current);
  }, [nonce]);

  function mine() {
    const t = tries + 1;
    setTries(t);
    if (t >= TARGET_TRIES) {
      const lucky = Math.floor(Math.random() * 0xffffffff)
        .toString(16)
        .padStart(8, "0");
      setNonce(lucky);
    }
  }

  if (stage === 1) {
    const won = Boolean(nonce);
    const kidPct = Math.min(100, (tries / TARGET_TRIES) * 100);
    const rivalPct = Math.min(100, (rival / TARGET_TRIES) * 100);
    return (
      <div>
        <h3 className="game-title">⛏️ 第一幕：算力比赛开始！</h3>
        <p className="game-desc">
          PoW（工作量证明）就是一场比赛：每位矿工疯狂计算，谁先找到那把「幸运钥匙」（Nonce），谁就能打包区块！
          <b> 连点下面的按钮，帮你的小矿工一起计算！</b>
        </p>

        <div className="race">
          <div className="racer">
            <div className="racer-name">🦊 你的小矿工 {won && "🏆 幸运钥匙找到了！"}</div>
            <div className="race-bar">
              <div className="race-fill" style={{ width: `${kidPct}%`, background: chapter.color }} />
            </div>
            <div className="race-tries">
              {won ? `Nonce = ${nonce}` : `已尝试 ${tries} 次哈希`}
            </div>
          </div>
          <div className="racer">
            <div className="racer-name">🤖 对手矿工</div>
            <div className="race-bar">
              <div className="race-fill" style={{ width: `${rivalPct}%`, background: "#b9c2e8" }} />
            </div>
            <div className="race-tries">已尝试 {rival} 次哈希</div>
          </div>
        </div>

        <div className="game-actions">
          {!won && (
            <button className="btn big" style={{ background: chapter.color }} onClick={mine}>
              ⚡ 计算！寻找幸运钥匙（{tries}/{TARGET_TRIES}）
            </button>
          )}
          {won && (
            <button className="btn" style={{ background: chapter.color }} onClick={() => setStage(2)}>
              领取区块奖励，继续 →
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stage === 2) {
    return (
      <div>
        <h3 className="game-title">🌍 第二幕：算力的另一面</h3>
        <div className="story-card" style={{ borderColor: chapter.color }}>
          <div className="story-emoji">⚡</div>
          <div className="story-text">
            你刚才点了 8 次，就累了，对吧？真实网络里的矿工每秒要尝试<b>几百万亿次</b>！
            <br />
            <br />
            这让 PoW 非常安全——想作弊，就得花掉比全世界都多的电费。
            <br />
            <br />
            但是……地球的电力是有限的。🌱 工程师们发明了更聪明、更环保的方式：
            <b>权益证明（PoS）</b>，就在最后一章等你！
          </div>
        </div>
        <div className="game-actions">
          <button className="btn" style={{ background: chapter.color }} onClick={() => setStage(3)}>
            我理解了，去答题 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="game-title">🧠 第三幕：PoW 小建造者问答</h3>
      <Quiz questions={chapter.quiz} accent={chapter.color} onAllCorrect={onComplete} />
    </div>
  );
}

export default PowGame;
