"use client";

import React, { useMemo, useState } from "react";
import type { Chapter } from "@/lib/chapters";
import { Quiz } from "@/components/Quiz";

/**
 * Chapter 1 — Blockchain World: "Magic Notebook" (魔法记录本)
 * Stage 1: write 3 records, pack them into blocks, watch the hash chain grow.
 * Stage 2: try to tamper with history — and watch the chain break.
 * Stage 3: quiz.
 */

type Block = { id: number; text: string; hash: string; prevHash: string };

function fakeHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").repeat(2);
}

const IDEAS = ["我帮同桌讲解了数学题", "我把图书馆的书放回原位", "我给流浪猫喂了水", "我教会了弟弟系鞋带", "我主动捡起了操场上的垃圾"];

export function BlockchainGame({ chapter, onComplete }: { chapter: Chapter; onComplete: () => void }) {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [nextIdea, setNextIdea] = useState(0);
  const [tampered, setTampered] = useState(false);

  const canTamper = blocks.length >= 3;

  function addRecord() {
    if (tampered) return;
    const text = IDEAS[nextIdea % IDEAS.length];
    const prevHash = blocks.length === 0 ? "0000...0000" : blocks[blocks.length - 1].hash;
    const hash = fakeHash(text + prevHash + blocks.length);
    setBlocks((b) => [...b, { id: blocks.length + 1, text, hash, prevHash }]);
    setNextIdea((i) => i + 1);
  }

  function tryTamper() {
    setTampered(true);
  }

  const linkClass = useMemo(() => (tampered ? "link broken" : "link"), [tampered]);

  if (stage === 1) {
    return (
      <div>
        <h3 className="game-title">📖 第一幕：把好事写进魔法记录本</h3>
        <p className="game-desc">
          每一条记录都会被打包进一个「区块」。区块会记住上一块的指纹，永远连在一起。
        </p>
        <div className="chain-area">
          <div className="chain-row">
            {blocks.length === 0 && (
              <div className="chain-empty">还没有记录。点击下面的按钮，写下第一笔！</div>
            )}
            {blocks.map((b, i) => (
              <React.Fragment key={b.id}>
                {i > 0 && <div className={linkClass}>{tampered ? "❌" : "🔗"}</div>}
                <div className={`block ${tampered && b.id === 1 ? "tampered" : ""}`}>
                  <div className="block-id">区块 #{b.id}</div>
                  <div className="block-text">{b.text}</div>
                  <div className="block-hash">
                    指纹: <code>{tampered && b.id === 1 ? "AAAA...FFFF" : b.hash.slice(0, 12) + "…"}</code>
                  </div>
                  <div className="block-hash">
                    上一页: <code>{b.prevHash.slice(0, 12) + "…"}</code>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="game-actions">
          {!tampered && (
            <button className="btn" style={{ background: chapter.color }} onClick={addRecord}>
              {blocks.length === 0 ? "✍️ 写下第一笔记录" : blocks.length < 3 ? "✍️ 再写一笔，打包新区块" : "进入第二幕 →"}
              {blocks.length < 3 ? ` (${blocks.length}/3)` : ""}
            </button>
          )}
          {canTamper && !tampered && (
            <button className="btn btn-ghost" onClick={() => setStage(2)}>
              试试「篡改历史」实验 🧪
            </button>
          )}
          {canTamper && !tampered && (
            <button
              className="btn"
              style={{ background: chapter.color }}
              onClick={() => setStage(3)}
            >
              跳过实验，直接答题 →
            </button>
          )}
          {tampered && (
            <button className="btn" style={{ background: chapter.color }} onClick={() => setStage(3)}>
              我明白了！去答题 →
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stage === 2) {
    return (
      <div>
        <h3 className="game-title">🧪 第二幕：篡改实验 —— 谁想改掉历史？</h3>
        <p className="game-desc">
          有个小坏人想把区块 #1 的记录改掉。看看魔法记录本会怎么反应！
        </p>
        <div className="chain-area">
          <div className="chain-row">
            {blocks.map((b, i) => (
              <React.Fragment key={b.id}>
                {i > 0 && <div className="link broken">❌</div>}
                <div className={`block tampered`}>
                  <div className="block-id">区块 #{b.id}</div>
                  <div className="block-text">{b.id === 1 ? "（被改坏了！篡改成：我什么都没做）" : b.text}</div>
                  <div className="block-hash">
                    指纹: <code>{b.id === 1 ? "AAAA...FFFF" : b.hash.slice(0, 12) + "…"}</code>
                  </div>
                  <div className="block-hash">
                    上一页: <code>{b.prevHash.slice(0, 12) + "…"}</code>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="tamper-reveal">
          🚨 看到了吗？<b>区块 #1 被改动后，它后面的所有「指纹连线」全部断掉了</b>。
          全网每个人手里都有一份完整的副本，假的一比就被发现！
          <br />
          <br />
          这就是区块链最神奇的地方：<b>历史无法被偷偷改写</b>。
        </div>
        <div className="game-actions">
          <button className="btn" style={{ background: chapter.color }} onClick={() => setStage(3)}>
            我明白了！去答题 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="game-title">🧠 第三幕：区块链小博士问答</h3>
      <Quiz
        questions={chapter.quiz}
        accent={chapter.color}
        onAllCorrect={onComplete}
      />
    </div>
  );
}
