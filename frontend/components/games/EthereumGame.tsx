"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Chapter } from "@/lib/chapters";
import { Quiz } from "@/components/Quiz";

/**
 * Chapter 5 — Ethereum World: 「智能合约工坊」
 * Act 1 (blueprint): assemble a smart contract by tapping the 4 build steps
 *   in the right order (write rules → compile → deploy → auto-run).
 * Act 2 (deploy): launch the contract to the Ethereum "public computer".
 * Act 3 (vending machine): use the deployed contract like an automatic
 *   vending machine — it executes by itself, rejects cheaters (revert),
 *   and nobody — not even the author — can rewrite the rules afterwards.
 * Act 4 (quiz, answer: smart-contract).
 */

type Phase = "blueprint" | "deploy" | "vending" | "quiz";

const STEPS = [
  { id: 1, emoji: "📜", name: "写明规则", note: "1 枚魔法币 = 1 颗星星糖，谁都能来买" },
  { id: 2, emoji: "⚙️", name: "编译", note: "把规则翻译成机器能读懂的语言" },
  { id: 3, emoji: "🚀", name: "部署", note: "发布到以太坊，获得一个专属地址" },
  { id: 4, emoji: "🤖", name: "上线运行", note: "自动执行，规则永远不能再改" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function EthereumGame({ chapter, onComplete }: { chapter: Chapter; onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>("blueprint");
  const [deck] = useState<number[]>(() => shuffle([1, 2, 3, 4]));
  const [next, setNext] = useState(1);
  const [placed, setPlaced] = useState<number[]>([]);
  const [shakeId, setShakeId] = useState<number | null>(null);
  const [wrongMsg, setWrongMsg] = useState<string | null>(null);

  const [launching, setLaunching] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const [coins, setCoins] = useState(3);
  const [candies, setCandies] = useState(0);
  const [triedCheat, setTriedCheat] = useState(false);
  const [triedTamper, setTriedTamper] = useState(false);
  const [buzz, setBuzz] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const timers = useMemo(() => [] as ReturnType<typeof setTimeout>[], []);
  useEffect(() => () => timers.forEach(clearTimeout), [timers]);

  const pushLog = (line: string) => setLog((l) => [line, ...l].slice(0, 4));

  // ---------------- Act 1: blueprint assembly ----------------
  function placeStep(stepId: number) {
    if (placed.includes(stepId)) return;
    if (stepId === next) {
      const done = [...placed, stepId];
      setPlaced(done);
      pushLog(`✅ ${STEPS[stepId - 1].name} —— ${STEPS[stepId - 1].note}`);
      if (done.length === STEPS.length) {
        timers.push(setTimeout(() => setPhase("deploy"), 700));
      } else {
        setNext(stepId + 1);
      }
    } else {
      setShakeId(stepId);
      setWrongMsg("⏳ 顺序不对哦 —— 先想想：没有写规则，怎么能编译呢？");
      timers.push(
        setTimeout(() => {
          setShakeId(null);
          setWrongMsg(null);
        }, 900)
      );
    }
  }

  // ---------------- Act 2: deploy ----------------
  function launch() {
    setLaunching(true);
    timers.push(
      setTimeout(() => {
        setDeployed(true);
        pushLog("🚀 合约已部署到以太坊，获得专属地址！");
      }, 1500)
    );
  }

  // ---------------- Act 3: vending machine ----------------
  function buyCandy() {
    if (coins <= 0) {
      setBuzz("soldout");
      pushLog("🪙 你没有魔法币了……（但合约依然忠诚地等待下一位顾客）");
      timers.push(setTimeout(() => setBuzz(null), 800));
      return;
    }
    setCoins((c) => c - 1);
    setCandies((c) => c + 1);
    setBuzz("buy");
    pushLog("🍬 叮——糖果自动出货！合约自己执行，不需要任何店员。");
    timers.push(setTimeout(() => setBuzz(null), 900));
  }

  function tryCheat() {
    setTriedCheat(true);
    setBuzz("revert");
    pushLog("❌ 没投币就想拿走糖果 → 交易被回滚（Revert），合约瞬间拒绝！");
    timers.push(setTimeout(() => setBuzz(null), 1100));
  }

  function tryTamper() {
    setTriedTamper(true);
    setBuzz("tamper");
    pushLog("🔒 想把价格改成 0？规则写死在链上，作者本人也改不了！");
    timers.push(setTimeout(() => setBuzz(null), 1100));
  }

  const vendingDone = candies >= 1;

  // ---------------- Act 1 ----------------
  if (phase === "blueprint") {
    return (
      <div>
        <h3 className="game-title">🧱 第一幕：搭出你的智能合约</h3>
        <p className="game-desc">
          以太坊上最神奇的发明是<b>智能合约</b>：一段写清楚规则、然后自己执行的程序。
          下面 4 块「合约积木」顺序被打乱了，请按正确的<b>建造顺序</b>点一点：
          <b>先写规则 → 再编译 → 然后部署 → 最后自动运行</b>。
        </p>

        <div className="gk-log">
          {log.slice(0, 3).map((l, i) => (
            <div key={i} className="gk-log-line">{l}</div>
          ))}
        </div>

        <div className="eth-build-line">
          {STEPS.map((s) => (
            <span key={s.id} className={`eth-build-step ${placed.includes(s.id) ? "on" : ""}`}>
              {s.emoji}
            </span>
          ))}
        </div>

        <div className="eth-blueprint-grid">
          {deck.map((id) => {
            const s = STEPS[id - 1];
            const done = placed.includes(id);
            return (
              <button
                key={id}
                type="button"
                className={`eth-brick ${done ? "done" : ""} ${shakeId === id ? "gk-shake" : ""}`}
                style={{ ["--pc" as string]: chapter.color }}
                disabled={done}
                onClick={() => placeStep(id)}
              >
                <span className="eth-brick-emoji">{done ? "✅" : s.emoji}</span>
                <b className="eth-brick-name">{s.name}</b>
                <span className="eth-brick-note">{s.note}</span>
                {done && <span className="eth-brick-order">第 {id} 步 ✓</span>}
              </button>
            );
          })}
        </div>

        {wrongMsg && <div className="eth-wrong pop-in">{wrongMsg}</div>}
      </div>
    );
  }

  // ---------------- Act 2 ----------------
  if (phase === "deploy") {
    return (
      <div>
        <h3 className="game-title">🚀 第二幕：部署到以太坊</h3>
        <p className="game-desc">
          现在把编译好的合约<b>发布（部署）</b>到以太坊这台「全世界的公共计算机」上。
          部署之后，它会获得一个专属地址，从此<b>自己运行、不再需要任何人操作</b>。
        </p>

        <div className={`eth-rocket-zone ${launching ? "eth-launching" : ""}`}>
          <div className="eth-rocket">🚀</div>
          {deployed && (
            <div className="eth-addr pop-in">
              合约已上线！
              <span className="eth-addr-code">0x5E7…F13D · Ethereum</span>
            </div>
          )}
        </div>

        <div className="game-actions">
          {!deployed && (
            <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={launch} disabled={launching}>
              {launching ? "🔥 点火发射中…" : "🚀 点击部署！"}
            </button>
          )}
          {deployed && (
            <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={() => setPhase("vending")}>
              🍬 去使用这台自动售货机 →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------------- Act 3 ----------------
  if (phase === "vending") {
    return (
      <div>
        <h3 className="game-title">🍬 第三幕：体验智能合约</h3>
        <p className="game-desc">
          这就是你刚才部署的合约——一台<b>区块链自动售货机</b>（你有 3 枚魔法币，它的价格是
          <b> 1 币 = 1 颗星星糖</b>）。试试看会发生什么！
        </p>

        <div className={`eth-machine ${buzz === "revert" ? "gk-shake gk-pop-bad" : ""} ${buzz === "tamper" ? "gk-shake" : ""} ${buzz === "buy" ? "eth-dispense" : ""}`}>
          <div className="eth-machine-top">
            <span className="eth-machine-emoji">🤖</span>
            <div>
              <b>星星糖自动售货机</b>
              <div className="eth-machine-addr">合约地址 0x5E7…F13D</div>
            </div>
          </div>
          <div className="eth-machine-rules">
            <span>📜 规则：投 1 枚魔法币 → 出 1 颗星星糖（不可修改）</span>
          </div>
          <div className="eth-slot">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`eth-candy ${i < candies ? "taken" : ""}`}>
                🍬
              </span>
            ))}
          </div>
          <div className="eth-coins">🪙 我的魔法币：<b>{coins}</b></div>
          {buzz === "revert" && <div className="eth-buzz pop-in">❌ REVERT —— 交易被回滚！</div>}
          {buzz === "tamper" && <div className="eth-buzz pop-in">🔒 拒绝修改 —— 规则不可篡改！</div>}
          {buzz === "soldout" && <div className="eth-buzz pop-in">😅 你的币用完啦</div>}
        </div>

        <div className="gk-choice-row">
          <button className="gk-choice-card gk-good" onClick={buyCandy}>
            <span className="gk-choice-emoji">🪙</span>
            <b>投 1 枚币，买糖</b>
            <span className="gk-choice-note">合约自动执行，无需店员</span>
          </button>
          <button className="gk-choice-card gk-bad" onClick={tryCheat}>
            <span className="gk-choice-emoji">🖐️</span>
            <b>不投币直接拿走</b>
            <span className="gk-choice-note">试试能不能骗过合约…</span>
          </button>
          <button className="gk-choice-card gk-bad" onClick={tryTamper}>
            <span className="gk-choice-emoji">🔧</span>
            <b>偷偷把价格改成 0</b>
            <span className="gk-choice-note">我写的合约，能改吗？</span>
          </button>
        </div>

        <div className="gk-log">
          {log.slice(0, 3).map((l, i) => (
            <div key={i} className="gk-log-line">{l}</div>
          ))}
        </div>

        {!vendingDone && (
          <p className="quiz-hint">💡 先成功买 1 颗糖，再试试那两颗红色按钮 —— 看合约会怎么拒绝你！</p>
        )}

        <div className="game-actions">
          <button className="btn gk-big-btn" style={{ background: chapter.color }} disabled={!vendingDone} onClick={() => setPhase("quiz")}>
            {vendingDone ? "🧠 我懂了，去小博士问答 →" : "先买一颗糖，按钮才会解锁…"}
          </button>
        </div>
      </div>
    );
  }

  // ---------------- Act 4: quiz ----------------
  return (
    <div>
      <h3 className="game-title">🧠 第四幕：智能合约小博士问答</h3>
      <Quiz questions={chapter.quiz} accent={chapter.color} onAllCorrect={onComplete} />
    </div>
  );
}
