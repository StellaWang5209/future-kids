"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Chapter } from "@/lib/chapters";
import { Quiz } from "@/components/Quiz";

/**
 * Chapter 1 — Blockchain World: 「方块造物主」
 * Act 1 (catch): good deeds rain down — tap to catch them into the magic notebook,
 *   then "pack" them into a block with a hash-crunching animation. Build a 3-block chain.
 * Act 2 (tamper): a sneaky fox asks the kid to rewrite history — tap it yourself and
 *   watch the whole chain shatter, then all 6 kids raise their copies.
 * Act 3 (quiz).
 */

type Block = { id: number; records: string[]; hash: string; prevHash: string };

function fakeHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").repeat(2);
}

const DEEDS = [
  { emoji: "🐱", text: "喂了流浪猫" },
  { emoji: "📚", text: "帮同学讲题" },
  { emoji: "🌿", text: "捡起垃圾" },
  { emoji: "👟", text: "教弟弟系鞋带" },
  { emoji: "💧", text: "给花浇水" },
  { emoji: "🤝", text: "扶起摔倒的同学" },
];

const RECORDS_PER_BLOCK = 2;
const TOTAL_BLOCKS = 3;

type FallingItem = { key: number; x: number; emoji: string; text: string };

export function BlockchainGame({ chapter, onComplete }: { chapter: Chapter; onComplete: () => void }) {
  const [phase, setPhase] = useState<"catch" | "pack" | "tamper" | "quiz">("catch");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [caught, setCaught] = useState<string[]>([]);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [crunching, setCrunching] = useState(false);
  const [displayHash, setDisplayHash] = useState("");
  const [foxPhase, setFoxPhase] = useState<"ask" | "shatter" | "copies">("ask");
  const keyRef = useRef(0);
  const deedRef = useRef(0);

  const needRecords = blocks.length < TOTAL_BLOCKS;
  const caughtNeeded = RECORDS_PER_BLOCK;

  // Spawn falling deeds while catching.
  useEffect(() => {
    if (phase !== "catch" || !needRecords) return;
    if (caught.length >= caughtNeeded) return;
    const t = setInterval(() => {
      setItems((cur) => {
        if (cur.length >= 3) return cur;
        const d = DEEDS[deedRef.current++ % DEEDS.length];
        return [...cur, { key: ++keyRef.current, x: 8 + Math.random() * 74, emoji: d.emoji, text: d.text }];
      });
    }, 950);
    return () => clearInterval(t);
  }, [phase, needRecords, caught.length]);

  // Auto-clean missed items.
  useEffect(() => {
    if (items.length === 0) return;
    const t = setTimeout(() => setItems((cur) => cur.slice(1)), 5200);
    return () => clearTimeout(t);
  }, [items]);

  const catchItem = useCallback((key: number) => {
    setItems((cur) => {
      const hit = cur.find((i) => i.key === key);
      if (hit) {
        setCaught((c) => (c.length < caughtNeeded ? [...c, hit.text] : c));
      }
      return cur.filter((i) => i.key !== key);
    });
  }, []);

  function packBlock() {
    setCrunching(true);
    setPhase("pack");
    const real = fakeHash(caught.join("|") + blocks.length);
    let ticks = 0;
    const iv = setInterval(() => {
      ticks++;
      const hex = "0123456789abcdef";
      let s = "";
      for (let i = 0; i < 16; i++) s += hex[Math.floor(Math.random() * 16)];
      setDisplayHash(s);
      if (ticks >= 14) {
        clearInterval(iv);
        setDisplayHash(real.slice(0, 16));
        setTimeout(() => {
          const prevHash = blocks.length === 0 ? "0000000000000000" : blocks[blocks.length - 1].hash;
          setBlocks((b) => [...b, { id: b.length + 1, records: [...caught], hash: real, prevHash }]);
          setCaught([]);
          setCrunching(false);
          setPhase("catch");
        }, 700);
      }
    }, 90);
  }

  function doTamper() {
    setFoxPhase("shatter");
    setTimeout(() => setFoxPhase("copies"), 1600);
  }

  const readyToPack = caught.length >= caughtNeeded && needRecords;

  // ---------- Act 1: catch + pack ----------
  if (phase === "catch" || phase === "pack") {
    const progress = blocks.length * caughtNeeded + caught.length;
    const totalNeeded = TOTAL_BLOCKS * caughtNeeded;
    return (
      <div>
        <h3 className="game-title">🎮 第一幕：接住好事，炼成区块！</h3>
        <p className="game-desc">天上掉下来的都是「好事」—— 点它们，接进魔法记录本！</p>

        <div className="gk-catch-arena" style={{ borderColor: chapter.color }}>
          {items.map((it) => (
            <button
              key={it.key}
              className="gk-falling"
              style={{ left: `${it.x}%` }}
              onClick={() => catchItem(it.key)}
              aria-label={it.text}
            >
              <span className="gk-falling-emoji">{it.emoji}</span>
              <span className="gk-falling-text">{it.text}</span>
            </button>
          ))}
          <div className="gk-notebook">
            <div className="gk-notebook-title">📔 魔法记录本</div>
            <div className="gk-notebook-slots">
              {Array.from({ length: caughtNeeded }).map((_, i) => (
                <span key={i} className={`gk-slot ${i < caught.length ? "filled" : ""}`}>
                  {i < caught.length ? caught[i].slice(0, 4) + "…" : "＋"}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="gk-progress">
          <div className="gk-progress-bar" style={{ width: `${(progress / totalNeeded) * 100}%`, background: chapter.color }} />
        </div>

        {/* The chain grows here */}
        <div className="chain-area">
          <div className="chain-row">
            {blocks.map((b, i) => (
              <React.Fragment key={b.id}>
                {i > 0 && <div className="link pop-in">🔗</div>}
                <div className="block pop-in">
                  <div className="block-id">区块 #{b.id}</div>
                  {b.records.map((r, j) => (
                    <div className="block-text" key={j}>✅ {r}</div>
                  ))}
                  <div className="block-hash">指纹: <code>{crunching && b.id === blocks.length ? displayHash : b.hash.slice(0, 12) + "…"}</code></div>
                  <div className="block-hash">上一页: <code>{b.prevHash.slice(0, 12)}…</code></div>
                </div>
              </React.Fragment>
            ))}
            {readyToPack && (
              <div className="link">⏳</div>
            )}
            {readyToPack && (
              <div className={`block gk-packing ${crunching ? "crunching" : ""}`}>
                <div className="block-id">新区块?</div>
                <div className="block-text">{crunching ? `🧮 指纹计算中… ${displayHash}` : "满了！点下面打包 →"}</div>
              </div>
            )}
          </div>
        </div>

        <div className="game-actions">
          {readyToPack && !crunching && (
            <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={packBlock}>
              📦 打包成区块！
            </button>
          )}
          {!needRecords && (
            <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={() => setPhase("tamper")}>
              链造好了！去见小狐狸 🦊 →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------- Act 2: tamper experiment (interactive) ----------
  if (phase === "tamper") {
    return (
      <div>
        <h3 className="game-title">🦊 第二幕：小狐狸的请求</h3>
        <p className="game-desc">
          {foxPhase === "ask" && "小狐狸悄悄说：「帮我改一下区块 #1 吧，就说你什么都没做过…」 —— 你来点它试试！"}
          {foxPhase === "shatter" && "⚠️ 历史正在崩坏——"}
          {foxPhase === "copies" && "可是……别的小朋友都不答应！"}
        </p>

        <div className={`chain-area ${foxPhase !== "ask" ? "gk-shake" : ""}`}>
          <div className="chain-row">
            {blocks.map((b, i) => (
              <React.Fragment key={b.id}>
                {i > 0 && <div className={`link ${foxPhase !== "ask" ? "broken" : ""}`}>{foxPhase !== "ask" ? "❌" : "🔗"}</div>}
                <div className={`block ${foxPhase !== "ask" ? "tampered" : ""} ${foxPhase === "shatter" ? "gk-pop-bad" : ""}`}>
                  <div className="block-id">区块 #{b.id}</div>
                  <div className="block-text">
                    {b.id === 1 && foxPhase !== "ask" ? "🖤（被改坏：我什么都没做）" : `✅ ${b.records[0]}`}
                  </div>
                  <div className="block-hash">指纹: <code>{b.id === 1 && foxPhase !== "ask" ? "AAAA…FFFF" : b.hash.slice(0, 12) + "…"}</code></div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {foxPhase === "ask" && (
          <div className="game-actions">
            <button className="btn gk-big-btn gk-fox-btn" onClick={doTamper}>
              😈 帮小狐狸改掉记录（试试看！）
            </button>
          </div>
        )}

        {foxPhase === "copies" && (
          <>
            <div className="gk-copies-row">
              {["👦", "👧", "🧒", "👶", "👨‍🎓", "👩‍🎓"].map((e, i) => (
                <div className="gk-copy-kid pop-in" style={{ animationDelay: `${i * 0.18}s` }} key={i}>
                  <span className="gk-copy-face">{e}</span>
                  <span className="gk-copy-bubble">我这里有完整副本！这份是假的！</span>
                </div>
              ))}
            </div>
            <div className="tamper-reveal">
              🚨 <b>改掉一个区块，它后面所有的指纹连线全部断掉</b> —— 而且全网每个人手里都有一份真副本，一比就穿帮！
              <br />这就是区块链的超能力：<b>历史无法被偷偷改写</b>。
            </div>
            <div className="game-actions">
              <button className="btn gk-big-btn" style={{ background: chapter.color }} onClick={() => setPhase("quiz")}>
                我亲手试过了！去答题 →
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---------- Act 3: quiz ----------
  return (
    <div>
      <h3 className="game-title">🧠 第三幕：区块链小博士问答</h3>
      <Quiz questions={chapter.quiz} accent={chapter.color} onAllCorrect={onComplete} />
    </div>
  );
}
