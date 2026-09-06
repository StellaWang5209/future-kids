"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Chapter } from "@/lib/chapters";
import { Quiz } from "@/components/Quiz";

/**
 * Chapter 3 — PoW World: 「算力大作战」
 * Act 1 (race): mash the button to hunt for the lucky nonce while a rival miner
 *   races you. Hash scramble animation, live progress bars, confetti on win.
 * Act 2 (energy): pick your mining rig's power source — see the environment meter
 *   react. No lecture, just consequence.
 * Act 3 (quiz, answer: proof-of-work).
 */

const TARGET_TRIES = 10;

const ENERGIES = [
  { emoji: "☀️", name: "太阳能", env: 90, note: "阳光免费又干净——很多矿场搬到了沙漠和屋顶！" },
  { emoji: "💧", name: "水力发电", env: 75, note: "大江大河的力量，清洁但受季节影响。" },
  { emoji: "🪨", name: "烧煤", env: 15, note: "便宜但污染严重——这是 PoW 被批评的最大原因。" },
];

export function PowGame({ chapter, onComplete }: { chapter: Chapter; onComplete: () => void }) {
  const [phase, setPhase] = useState<"race" | "won" | "energy" | "quiz">("race");
  const [tries, setTries] = useState(0);
  const [rival, setRival] = useState(0);
  const [scramble, setScramble] = useState("0000000000000000");
  const [energy, setEnergy] = useState<number | null>(null);
  const scrambleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rivalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const won = tries >= TARGET_TRIES;

  // Hash scramble while racing
  useEffect(() => {
    if (phase !== "race" || won) return;
    scrambleRef.current = setInterval(() => {
      const hex = "0123456789abcdef";
      let s = "";
      for (let i = 0; i < 16; i++) s += hex[Math.floor(Math.random() * 16)];
      setScramble(s);
    }, 90);
    return () => {
      if (scrambleRef.current) clearInterval(scrambleRef.current);
    };
  }, [phase, won]);

  // Rival miner
  useEffect(() => {
    if (phase !== "race" || won) return;
    rivalRef.current = setInterval(() => {
      setRival((r) => Math.min(TARGET_TRIES - 3, r + 1));
    }, 1600);
    return () => {
      if (rivalRef.current) clearInterval(rivalRef.current);
    };
  }, [phase, won]);

  // Win detection
  useEffect(() => {
    if (won && phase === "race") {
      setTimeout(() => setPhase("won"), 500);
    }
  }, [won, phase]);

  function swing() {
    setTries((t) => Math.min(TARGET_TRIES, t + 1));
  }

  // ---------- Act 1: race ----------
  if (phase === "race" || phase === "won") {
    return (
      <div>
        <h3 className="game-title">🏁 第一幕：算力大作战！</h3>
        <p className="game-desc">
          狂点「计算！」—— 谁先找到幸运数字 <b>Nonce</b>，谁就赢得记账权 + 新币奖励！
        </p>

        <div className="gk-race-zone">
          <div className="gk-racer" style={{ borderColor: chapter.color }}>
            <div className="gk-racer-name">🧒 你</div>
            <div className="gk-race-track">
              <div className="gk-race-fill" style={{ width: `${(tries / TARGET_TRIES) * 100}%`, background: chapter.color }} />
            </div>
            <div className="gk-racer-score">{tries} / {TARGET_TRIES} 次尝试</div>
          </div>
          <div className="gk-racer">
            <div className="gk-racer-name">🤖 对手矿工</div>
            <div className="gk-race-track">
              <div className="gk-race-fill rival" style={{ width: `${(rival / TARGET_TRIES) * 100}%` }} />
            </div>
            <div className="gk-racer-score">{rival} / {TARGET_TRIES} 次尝试</div>
          </div>
        </div>

        <div className={`gk-hash-screen ${won ? "gk-hash-win" : ""}`}>
          <span className="gk-hash-label">当前哈希尝试</span>
          <code className="gk-hash-code">{won ? "🎉 00000abc… 命中！" : scramble}</code>
        </div>

        <div className="game-actions">
          {!won && (
            <button className="btn gk-big-btn gk-mash" style={{ background: chapter.color }} onClick={swing}>
              ⚡ 计算！（狂点！）
            </button>
          )}
          {won && (
            <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={() => setPhase("energy")}>
              🎉 赢啦！给矿场选个电源 →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------- Act 2: energy choice ----------
  if (phase === "energy") {
    return (
      <div>
        <h3 className="game-title">🌍 第二幕：给你的矿场选电源</h3>
        <p className="game-desc">PoW 很安全，但很耗电。你的选择决定矿场的「地球友好度」：</p>

        {energy === null ? (
          <div className="gk-choice-row">
            {ENERGIES.map((e, i) => (
              <button key={i} className="gk-choice-card" onClick={() => setEnergy(i)}>
                <span className="gk-choice-emoji">{e.emoji}</span>
                <b>{e.name}</b>
                <span className="gk-choice-note">{e.note}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="gk-energy-result pop-in">
            <div className="gk-energy-emoji">{ENERGIES[energy].emoji}</div>
            <div className="gk-energy-name">{ENERGIES[energy].name}矿场</div>
            <div className="gk-env-meter">
              <div className="gk-env-label">🌍 地球友好度</div>
              <div className="gk-env-track">
                <div
                  className="gk-env-fill"
                  style={{
                    width: `${ENERGIES[energy].env}%`,
                    background: ENERGIES[energy].env > 50 ? "#22a06b" : "#e5484d",
                  }}
                />
              </div>
            </div>
            <div className="gk-energy-note">{ENERGIES[energy].note}</div>
            <div className="tamper-reveal">
              所以真正的 PoS 链和绿色矿场都在努力：<b>安全</b> 和 <b>环保</b> 可以兼得。
            </div>
            <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={() => setPhase("quiz")}>
              去答题 →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------- Act 3: quiz ----------
  return (
    <div>
      <h3 className="game-title">🧠 第三幕：PoW 小博士问答</h3>
      <Quiz questions={chapter.quiz} accent={chapter.color} onAllCorrect={onComplete} />
    </div>
  );
}
