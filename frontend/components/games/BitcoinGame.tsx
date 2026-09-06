"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Chapter } from "@/lib/chapters";
import { Quiz } from "@/components/Quiz";

/**
 * Chapter 2 — Bitcoin World: 「2100 万的秘密」
 * Act 1 (mine): mash the pickaxe — every few swings the reward HALVES, until the
 *   faucet seals forever at 21,000,000. Scarcity experienced by hand.
 * Act 2 (ledger): choose who keeps the ledger — one big bank (hacked, money gone)
 *   vs six kids with copies (one hacked, five survive). Decentralization by consequence.
 * Act 3 (quiz, answer: 2100万).
 */

const HALVING_SWINGS = 4; // reward halves every N swings
const TAPS_TO_CAP = 22; // swings until the faucet seals

export function BitcoinGame({ chapter, onComplete }: { chapter: Chapter; onComplete: () => void }) {
  const [phase, setPhase] = useState<"mine" | "sealed" | "ledger" | "quiz">("mine");
  const [swings, setSwings] = useState(0);
  const [reward, setReward] = useState(5000000);
  const [total, setTotal] = useState(0);
  const [pops, setPops] = useState<{ key: number; text: string }[]>([]);
  const [ledgerChoice, setLedgerChoice] = useState<"bank" | "kids" | null>(null);
  const [hackStep, setHackStep] = useState(0);
  const popKey = useRef(0);
  const halved = useRef(false);

  const remaining = Math.max(0, TAPS_TO_CAP - swings);
  const sealed = remaining <= 0;

  function swing() {
    if (sealed) return;
    const s = swings + 1;
    setSwings(s);
    setTotal((t) => Math.min(21000000, t + reward));
    const key = ++popKey.current;
    setPops((p) => [...p, { key, text: `+${reward.toLocaleString()}` }]);
    // Halving!
    if (s % HALVING_SWINGS === 0 && reward > 0) {
      const nr = Math.floor(reward / 2);
      setTimeout(() => {
        setReward(nr < 100000 ? 0 : nr);
        halved.current = true;
      }, 250);
    }
    if (s >= TAPS_TO_CAP) {
      setTimeout(() => setPhase("sealed"), 700);
    }
  }

  // Auto-clean floating pops
  useEffect(() => {
    if (pops.length === 0) return;
    const t = setTimeout(() => setPops((p) => p.slice(1)), 900);
    return () => clearTimeout(t);
  }, [pops]);

  function runHack(kind: "bank" | "kids") {
    setLedgerChoice(kind);
    setHackStep(1);
    setTimeout(() => setHackStep(2), 1200);
    setTimeout(() => setHackStep(3), 2600);
  }

  // ---------- Act 1 + seal moment ----------
  if (phase === "mine" || phase === "sealed") {
    const cap = 21000000;
    const pct = Math.min(100, (total / cap) * 100);
    return (
      <div>
        <h3 className="game-title">⛏️ 第一幕：疯狂挖矿！</h3>
        <p className="game-desc">
          {phase === "sealed"
            ? "🔒 矿场永久封印——一枚也挖不出来了！"
            : reward > 0
              ? `狂点矿镐挖比特币！小心——每挖 ${HALVING_SWINGS} 下，产出就会减半！`
              : "新区块奖励变成了 0——这就是「挖完了」的感觉"}
        </p>

        <div className="gk-mine-zone" style={{ borderColor: chapter.color }}>
          <button
            className={`gk-pickaxe ${phase === "sealed" ? "gk-locked" : ""}`}
            style={{ borderColor: chapter.color }}
            onClick={swing}
            disabled={phase === "sealed"}
            aria-label="挖矿"
          >
            {phase === "sealed" ? "🔒" : "⛏️"}
          </button>
          <div className="gk-mine-stats">
            <div className="gk-mine-total">
              已挖出 <b>{total.toLocaleString()}</b> 枚
            </div>
            {reward > 0 && phase === "mine" && (
              <div className="gk-mine-reward">每击奖励 {reward.toLocaleString()} 枚</div>
            )}
            {pops.map((p) => (
              <span key={p.key} className="gk-float-up">
                {p.text}
              </span>
            ))}
          </div>
        </div>

        <div className="gk-supply">
          <div className="gk-supply-label">稀缺条 —— 比特币永恒上限 21,000,000</div>
          <div className="gk-supply-track">
            <div className="gk-supply-fill" style={{ width: `${pct}%`, background: chapter.color }} />
          </div>
          <div className="gk-supply-remain">剩余可挖：{remaining} 击</div>
        </div>

        {phase === "sealed" && (
          <div className="gk-seal-card pop-in">
            <div className="gk-seal-emoji">🏦🔒</div>
            <b>2100 万 —— 就是全部，一枚都不会再多。</b>
            <div className="gk-seal-note">
              不管是你挖、我挖、还是全世界一起挖——这串数字永远封顶。这就叫「稀缺性」。
            </div>
            <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={() => setPhase("ledger")}>
              下一关：谁来保管账本？→
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------- Act 2: ledger choice ----------
  if (phase === "ledger") {
    return (
      <div>
        <h3 className="game-title">⚔️ 第二幕：谁来保管大家的账本？</h3>
        <p className="game-desc">你的 1 枚金币要转给好朋友。选一个保管账本的人——选完就发钱！</p>

        {ledgerChoice === null && (
          <div className="gk-choice-row">
            <button className="gk-choice-card" onClick={() => runHack("bank")}>
              <span className="gk-choice-emoji">🏦</span>
              <b>一家大银行</b>
              <span className="gk-choice-note">只有 1 份账本，看着很可靠</span>
            </button>
            <button className="gk-choice-card" onClick={() => runHack("kids")}>
              <span className="gk-choice-emoji">👦👧🧒</span>
              <b>六个小朋友</b>
              <span className="gk-choice-note">每人手里一份账本副本</span>
            </button>
          </div>
        )}

        {ledgerChoice === "bank" && (
          <div className="gk-hack-stage">
            <div className={`gk-bank ${hackStep >= 3 ? "gk-bank-dead" : ""}`}>
              {hackStep >= 3 ? "💥 账本被毁" : hackStep >= 2 ? "🏦 🏴‍☠️ 黑客入侵中…" : "🏦 唯一的账本在这里"}
            </div>
            {hackStep >= 3 && (
              <>
                <div className="tamper-reveal pop-in">
                  🚨 黑客改掉了唯一一份账本——<b>你的金币消失了，没人能证明它存在过</b>。
                  <br />一份账本 = 一个单点故障。
                </div>
                <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={() => setPhase("quiz")}>
                  换小朋友试试 →
                </button>
              </>
            )}
          </div>
        )}

        {ledgerChoice === "kids" && (
          <div className="gk-hack-stage">
            <div className="gk-kids-ledger">
              {["👦", "👧", "🧒", "👶", "👨‍🎓", "👩‍🎓"].map((e, i) => (
                <div
                  key={i}
                  className={`gk-kid-node ${hackStep === 2 && i === 0 ? "under-attack" : ""} ${
                    hackStep >= 3 ? (i === 0 ? "hacked" : "safe") : ""
                  }`}
                >
                  <span>{hackStep >= 3 && i === 0 ? "🏴‍☠️" : e}</span>
                  {hackStep >= 3 && <span className="gk-kid-tag">{i === 0 ? "被黑了" : "副本OK ✓"}</span>}
                </div>
              ))}
            </div>
            {hackStep >= 3 && (
              <>
                <div className="tamper-reveal pop-in">
                  🛡️ 黑客只改掉了 1 份账本，<b>另外 5 份副本立刻证明他是假的</b>！
                  <br />这就是「去中心化」——<b>没有一个人能单独撒谎</b>。
                </div>
                <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={() => setPhase("quiz")}>
                  我选对了！去答题 →
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------- Act 3: quiz ----------
  return (
    <div>
      <h3 className="game-title">🧠 第三幕：比特币小博士问答</h3>
      <Quiz questions={chapter.quiz} accent={chapter.color} onAllCorrect={onComplete} />
    </div>
  );
}
