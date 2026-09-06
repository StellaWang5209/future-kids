"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Chapter } from "@/lib/chapters";
import { Quiz } from "@/components/Quiz";

/**
 * Chapter 4 — PoS World: 「守护者选举」
 * Act 1 (stake): choose how many coins to stake — your stake IS your lottery ticket
 *   count. 5 election rounds: a spotlight spins across validators (weighted random)
 *   and picks the block proposer. When YOU are picked: honest (+3) vs cheat (slashed!).
 * Act 2: why PoS saves 99.9% energy + your final score.
 * Act 3 (quiz, answer: proof-of-stake).
 */

type Rotor = { emoji: string; name: string; stake: number; isPlayer?: boolean };

const TOTAL_ROUNDS = 5;

export function PosGame({ chapter, onComplete }: { chapter: Chapter; onComplete: () => void }) {
  const [phase, setPhase] = useState<"stake" | "elect" | "summary" | "quiz">("stake");
  const [stake, setStake] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [spinIdx, setSpinIdx] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [balance, setBalance] = useState(10);
  const [log, setLog] = useState<string[]>([]);
  const [slashFx, setSlashFx] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const rotor: Rotor[] = stake
    ? [
        { emoji: "🧒", name: "你", stake, isPlayer: true },
        { emoji: "🐻", name: "熊博士", stake: 5 },
        { emoji: "🦊", name: "狐研究员", stake: 3 },
      ]
    : [];
  const totalTickets = rotor.reduce((s, r) => s + r.stake, 0);

  function startElection(s: number) {
    setStake(s);
    setPhase("elect");
  }

  function spin() {
    if (spinning || round >= TOTAL_ROUNDS) return;
    setSpinning(true);
    setChosen(null);
    let ticks = 0;
    const iv = setInterval(() => {
      setSpinIdx((i) => (i + 1) % rotor.length);
      ticks++;
      if (ticks >= 14) {
        clearInterval(iv);
        // Weighted pick
        let roll = Math.random() * totalTickets;
        let picked = 0;
        for (let i = 0; i < rotor.length; i++) {
          roll -= rotor[i].stake;
          if (roll <= 0) {
            picked = i;
            break;
          }
        }
        setSpinIdx(picked);
        setChosen(picked);
        setSpinning(false);
        if (!rotor[picked].isPlayer) {
          setLog((l) => [`${rotor[picked].emoji} ${rotor[picked].name} 诚实打包了区块 ✓`, ...l]);
          timers.current.push(setTimeout(() => setRound((r) => r + 1), 1500));
        }
      }
    }, 110);
  }

  function chooseHonest() {
    setBalance((b) => b + 3);
    setLog((l) => ["✅ 你认真验证了每一笔交易，+3 守护币", ...l]);
    timers.current.push(setTimeout(() => setRound((r) => r + 1), 1200));
    setChosen(null);
  }

  function chooseCheat() {
    setSlashFx(true);
    setBalance((b) => b - 10);
    setLog((l) => ["⚡ 企图作弊 → 质押被罚没（Slash）！-10 守护币", ...l]);
    timers.current.push(
      setTimeout(() => setSlashFx(false), 1400),
      setTimeout(() => {
        setChosen(null);
        setRound((r) => r + 1);
      }, 1600)
    );
  }

  useEffect(() => {
    if (round >= TOTAL_ROUNDS && phase === "elect") {
      const t = setTimeout(() => setPhase("summary"), 800);
      return () => clearTimeout(t);
    }
  }, [round, phase]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ---------- Act 1a: stake ----------
  if (phase === "stake") {
    return (
      <div>
        <h3 className="game-title">🪙 第一幕：押上你的守护币</h3>
        <p className="game-desc">
          PoS 世界里，<b>押得越多，被选中记账的机会越大</b>（你手上有 10 枚）。押上多少？
        </p>
        <div className="gk-choice-row">
          {[
            { n: 1, note: "小试身手 · 1 张抽奖券" },
            { n: 5, note: "稳扎稳打 · 5 张抽奖券" },
            { n: 10, note: "全力守护 · 10 张抽奖券（全押有风险！）" },
          ].map((o) => (
            <button key={o.n} className="gk-choice-card" onClick={() => startElection(o.n)}>
              <span className="gk-choice-emoji">🪙</span>
              <b>押 {o.n} 枚</b>
              <span className="gk-choice-note">{o.note}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------- Act 1b: election rounds ----------
  if (phase === "elect" && stake !== null) {
    return (
      <div>
        <h3 className="game-title">
          🏛️ 选举进行中 —— 第 {Math.min(round + 1, TOTAL_ROUNDS)} / {TOTAL_ROUNDS} 轮
        </h3>
        <p className="game-desc">
          {spinning && "聚光灯在抽签……"}
          {!spinning && chosen === null && "点「开始选举」！押金越多，票数越多！"}
          {!spinning && chosen !== null && rotor[chosen].isPlayer && "🎉 轮到你当区块生产者了！"}
          {!spinning && chosen !== null && !rotor[chosen].isPlayer && "其他守护者获得了记账权"}
        </p>

        <div className={`gk-rotor-zone ${slashFx ? "gk-shake" : ""}`}>
          {rotor.map((r, i) => (
            <div
              key={i}
              className={`gk-validator ${spinIdx === i && spinning ? "spinning" : ""} ${chosen === i ? "chosen" : ""}`}
            >
              <span className="gk-validator-emoji">{r.emoji}</span>
              <span className="gk-validator-name">{r.name}</span>
              <span className="gk-validator-stake">🪙 {r.stake} · {r.stake}票</span>
            </div>
          ))}
        </div>

        {slashFx && <div className="gk-slash pop-in">⚡ 质押被罚没（SLASHED）⚡</div>}

        {chosen !== null && rotor[chosen].isPlayer && !slashFx && (
          <div className="gk-choice-row">
            <button className="gk-choice-card gk-good" onClick={chooseHonest}>
              <span className="gk-choice-emoji">✅</span>
              <b>诚实验证每笔交易</b>
              <span className="gk-choice-note">奖励 +3 守护币</span>
            </button>
            <button className="gk-choice-card gk-bad" onClick={chooseCheat}>
              <span className="gk-choice-emoji">😈</span>
              <b>偷偷作弊双花</b>
              <span className="gk-choice-note">可能赚得多……真的吗？</span>
            </button>
          </div>
        )}

        {(chosen === null || spinning) && (
          <div className="game-actions">
            <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={spin} disabled={spinning}>
              {spinning ? "🎰 抽签中…" : "🎯 开始选举！"}
            </button>
          </div>
        )}

        <div className="gk-balance">💰 我的守护币：<b>{balance}</b></div>

        {log.length > 0 && (
          <div className="gk-log">
            {log.slice(0, 4).map((l, i) => (
              <div key={i} className="gk-log-line">{l}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------- Act 2: summary ----------
  if (phase === "summary") {
    const saved = balance >= 10;
    return (
      <div>
        <h3 className="game-title">🏆 第二幕：你的守护者成绩单</h3>
        <div className={`gk-seal-card pop-in ${saved ? "" : "gk-seal-warn"}`}>
          <div className="gk-seal-emoji">{saved ? "🛡️" : "🌱"}</div>
          <b>最终守护币：{balance} 枚</b>
          <div className="gk-seal-note">
            {saved
              ? "诚实 + 质押 = 守护者之路。PoS 里作弊会被当场罚没押金，诚实记账才有稳定奖励。"
              : "（作弊或失误会扣币——不过这就是最好的学习！）在 PoS 世界，押金就是信誉：诚实记账才有稳定奖励，作弊会被罚没（Slash）。"}
          </div>
          <div className="tamper-reveal">
            对比一下：PoW 比拼电力，PoS 比拼押金——<b>PoS 用不到千分之一的能源达成同样的安全</b>，
            这也是未来的方向。
          </div>
          <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={() => setPhase("quiz")}>
            去答题 →
          </button>
        </div>
      </div>
    );
  }

  // ---------- Act 3: quiz ----------
  return (
    <div>
      <h3 className="game-title">🧠 第三幕：PoS 小博士问答</h3>
      <Quiz questions={chapter.quiz} accent={chapter.color} onAllCorrect={onComplete} />
    </div>
  );
}
