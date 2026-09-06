"use client";

import React, { useState } from "react";
import type { Chapter } from "@/lib/chapters";
import { Quiz } from "@/components/Quiz";

/**
 * Chapter 4 — PoS World: "Guardian Castle" (守护者城堡)
 * Stage 1: stake your chips, then make 5 validation choices — honest work
 *          earns rewards, cheating gets slashed. Consequence-based learning.
 * Stage 2: energy comparison.
 * Stage 3: quiz.
 */

type Round = {
  situation: string;
  choices: { label: string; honest: boolean; result: string }[];
};

const ROUNDS: Round[] = [
  {
    situation: "🌙 深夜，一批交易等待验证。作为守护者，你会……",
    choices: [
      { label: "认真验证每一笔交易", honest: true, result: "✅ 验证正确！全网感谢你，+10 守护币" },
      { label: "偷懒，随便签个名", honest: false, result: "⚠️ 签名出错被发现了，-2 守护币" },
    ],
  },
  {
    situation: "😈 有人偷偷找你：「我们一起双花那笔交易吧，分你一半！」",
    choices: [
      { label: "拒绝！诚实的守护者不做坏事", honest: true, result: "🛡️ 你报告了攻击，全网为你点赞，+10 守护币" },
      { label: "答应他，一起作弊", honest: false, result: "💥 Slash！押金被罚没一大笔，臭名远扬" },
    ],
  },
  {
    situation: "🔋 网络提示你：可以切换到更省电的验证模式。",
    choices: [
      { label: "升级设备，选择省电模式", honest: true, result: "🌱 能耗降低 99.9%，奖励照常，+10 守护币" },
      { label: "不理它，继续老办法", honest: false, result: "🐢 慢了一步，错过奖励，-2 守护币" },
    ],
  },
  {
    situation: "⚖️ 两条链同时出现，需要你投票选择正确的那条。",
    choices: [
      { label: "投给记录最多、最完整的长链", honest: true, result: "✅ 你站对了边，+10 守护币" },
      { label: "随手乱投", honest: false, result: "❌ 投错了短链，-2 守护币" },
    ],
  },
  {
    situation: "🎖️ 一个新手守护者向你请教经验。",
    choices: [
      { label: "耐心分享诚实守护的心得", honest: true, result: "🌟 新人成长了，社区更强大，+10 守护币" },
      { label: "糊弄他两句", honest: false, result: " :( 新人走错了路，-2 守护币" },
    ],
  },
];

export function PosGame({ chapter, onComplete }: { chapter: Chapter; onComplete: () => void }) {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [staked, setStaked] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);
  const [honestCount, setHonestCount] = useState(0);

  function chooseStake(n: number) {
    setStaked(n);
    setCoins(n);
  }

  function pick(i: number) {
    if (result) return;
    const c = ROUNDS[round].choices[i];
    setResult(c.result);
    setCoins((v) => v + (c.honest ? 10 : -2));
    if (c.honest) setHonestCount((h) => h + 1);
  }

  function nextRound() {
    setResult(null);
    if (round + 1 < ROUNDS.length) {
      setRound(round + 1);
    } else {
      setStage(2);
    }
  }

  if (stage === 1 && staked === null) {
    return (
      <div>
        <h3 className="game-title">🏰 第一幕：成为守护者</h3>
        <p className="game-desc">
          PoS（权益证明）的规则：<b>先「质押」筹码作为诚信押金</b>，然后参与验证。诚实有奖励，作恶会被罚没（Slash）！
          选择你要质押的数量：
        </p>
        <div className="game-actions">
          {[1, 5, 10].map((n) => (
            <button key={n} className="btn" style={{ background: chapter.color }} onClick={() => chooseStake(n)}>
              质押 {n} 枚守护币
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (stage === 1) {
    const r = ROUNDS[round];
    return (
      <div>
        <h3 className="game-title">🛡️ 守护任务 {round + 1} / {ROUNDS.length}</h3>
        <div className="pos-coins">💰 押金 {staked} · 守护币余额 {coins}</div>
        <div className="story-card" style={{ borderColor: chapter.color }}>
          <div className="story-text">{r.situation}</div>
        </div>
        <div className="game-actions vertical">
          {r.choices.map((c, i) => (
            <button
              key={i}
              className="btn btn-choice"
              disabled={Boolean(result)}
              style={{ borderColor: chapter.color }}
              onClick={() => pick(i)}
            >
              {c.label}
            </button>
          ))}
        </div>
        {result && (
          <div className="pos-result">
            <div>{result}</div>
            <button className="btn" style={{ background: chapter.color }} onClick={nextRound}>
              {round + 1 < ROUNDS.length ? "下一个任务 →" : "看看守护成果 →"}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (stage === 2) {
    const perfect = honestCount === ROUNDS.length;
    return (
      <div>
        <h3 className="game-title">{perfect ? "🏆 满分守护者！" : "🌱 成长中的守护者"}</h3>
        <div className="story-card" style={{ borderColor: chapter.color }}>
          <div className="story-emoji">{perfect ? "🛡️" : "🌱"}</div>
          <div className="story-text">
            你做了 {ROUNDS.length} 次选择，其中 {honestCount} 次选择了诚实。
            {perfect
              ? "完美！诚实让网络更强大，这就是 PoS 的设计智慧。"
              : "记住哦：诚实守护有奖励，作恶会被罚没——机制让好人越来越多。"}
            <br />
            <br />
            以太坊用 PoS 之后，能耗降低了 <b>99.9%+</b>。守护网络，也守护地球！🌍
          </div>
        </div>
        <div className="game-actions">
          <button className="btn" style={{ background: chapter.color }} onClick={() => setStage(3)}>
            最终问答 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="game-title">🧠 第三幕：PoS 守护者问答</h3>
      <Quiz questions={chapter.quiz} accent={chapter.color} onAllCorrect={onComplete} />
    </div>
  );
}

export default PosGame;
