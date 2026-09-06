"use client";

import React, { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { proofAbi, badgeAbi } from "@/lib/abis";
import { contractAddresses, contractsConfigured } from "@/lib/wagmi";
import { useProgress } from "@/lib/progress";
import type { Chapter } from "@/lib/chapters";

/**
 * The graduation ceremony of a chapter.
 *
 * Reveals the chapter's final answer (which IS the lesson: the answer is
 * recorded on-chain as a learning proof), then either:
 *  - Demo mode: saves progress locally (no wallet needed — the default for kids)
 *  - On-chain mode: calls LearningProof.recordCompletion + AchievementBadge.mint
 */
export function CompletionPanel({ chapter, onClose }: { chapter: Chapter; onClose: () => void }) {
  const { address, isConnected } = useAccount();
  const { completeChapter } = useProgress();

  const [revealed, setRevealed] = useState(false);
  const [proofTx, setProofTx] = useState<string | null>(null);
  const [badgeTx, setBadgeTx] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onChain = contractsConfigured && isConnected && Boolean(address) && Boolean(contractAddresses.proof);

  const { writeContractAsync } = useWriteContract();

  const proofReceipt = useWaitForTransactionReceipt({ hash: proofTx as `0x${string}` | undefined });
  const badgeReceipt = useWaitForTransactionReceipt({ hash: badgeTx as `0x${string}` | undefined });

  async function recordOnChain() {
    if (!address) return;
    setError(null);
    try {
      const tx = await writeContractAsync({
        address: contractAddresses.proof as `0x${string}`,
        abi: proofAbi,
        functionName: "recordCompletion",
        args: [chapter.id, chapter.answer],
      });
      setProofTx(tx);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes("AlreadyRecorded") ? "这一章的证明已经在链上啦 🌟" : `链上记录失败：${msg.slice(0, 140)}`);
    }
  }

  async function mintBadge() {
    if (!address) return;
    setError(null);
    try {
      const tx = await writeContractAsync({
        address: contractAddresses.badge as `0x${string}`,
        abi: badgeAbi,
        functionName: "mint",
        args: [chapter.badgeType],
      });
      setBadgeTx(tx);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes("AlreadyHasBadge") ? "这枚徽章你已经拥有啦 🎖️" : `铸造徽章失败：${msg.slice(0, 140)}`);
    }
  }

  function finishDemo() {
    completeChapter(chapter.id, { demo: true });
    onClose();
  }

  // Called once the on-chain proof is confirmed (badge minting happens after)
  function finishOnChain() {
    completeChapter(chapter.id, { demo: false, proofTx: proofTx ?? undefined });
    // stay open — badge mint continues below
  }

  const proofConfirmed = proofTx ? proofReceipt.isSuccess : false;
  const badgeConfirmed = badgeTx ? badgeReceipt.isSuccess : false;

  if (proofConfirmed && proofTx) finishOnChain();
  if (badgeConfirmed && badgeTx) {
    // persist badge tx once
    completeChapter(chapter.id, { demo: false, proofTx: proofTx ?? undefined, badgeTx });
  }

  return (
    <div className="completion">
      <div className="completion-star">✦</div>
      <h2 className="completion-title">章节挑战完成！</h2>
      <p className="completion-sub">
        你通过了「{chapter.title}」的全部考验。每一章都有一把「知识钥匙」，它可以被永久记录在链上。
      </p>

      {!revealed ? (
        <div className="reveal-box">
          <button className="btn" style={{ background: chapter.color }} onClick={() => setRevealed(true)}>
            🔑 揭示本章的知识钥匙
          </button>
        </div>
      ) : (
        <div className="reveal-answer" style={{ borderColor: chapter.color }}>
          <div className="reveal-label">本章知识钥匙</div>
          <div className="reveal-value">{chapter.answer}</div>
          <div className="reveal-note">
            这串字符会被哈希后写入 LearningProof 合约 —— 答案本身就是课程内容，任何人都可以验证。
          </div>
        </div>
      )}

      {revealed && !onChain && (
        <div className="completion-actions">
          <button className="btn btn-big" style={{ background: chapter.color }} onClick={finishDemo}>
            🌱 记录到我的成长地图（本地模式）
          </button>
          <p className="completion-note">
            未连接钱包，进度保存在这台设备上。连接监护人钱包后，同样的旅程可以写入以太坊链上。
          </p>
        </div>
      )}

      {revealed && onChain && (
        <div className="completion-actions">
          {!proofTx && (
            <button className="btn btn-big" style={{ background: chapter.color }} onClick={recordOnChain}>
              ⛓️ 将学习证明写入链上
            </button>
          )}
          {proofTx && !proofConfirmed && <div className="tx-status">⏳ 学习证明交易确认中…</div>}
          {proofConfirmed && (
            <div className="tx-status ok">
              ✅ 学习证明已上链！
              {proofReceipt.data && (
                <a
                  className="link"
                  href={`https://sepolia.etherscan.io/tx/${proofTx}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  查看交易 ↗
                </a>
              )}
            </div>
          )}

          {proofConfirmed && !badgeTx && (
            <button className="btn btn-big" style={{ background: chapter.color }} onClick={mintBadge}>
              🎖️ 铸造我的灵魂绑定的徽章
            </button>
          )}
          {badgeTx && !badgeConfirmed && <div className="tx-status">⏳ 徽章铸造确认中…</div>}
          {badgeConfirmed && (
            <div className="tx-status ok">
              ✅ 徽章已铸造（Soulbound · 永久绑定 · 不可转让）！
              {badgeReceipt.data && (
                <a
                  className="link"
                  href={`https://sepolia.etherscan.io/tx/${badgeTx}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  查看交易 ↗
                </a>
              )}
            </div>
          )}

          {badgeConfirmed && (
            <button className="btn" onClick={onClose}>
              返回成长地图 🗺️
            </button>
          )}
          <p className="completion-note">
            Soulbound 徽章会永久绑定在这个地址上，不能买卖、不能转移 —— 它代表「你真的学会了」。
          </p>
        </div>
      )}

      {error && <div className="tx-status err">😢 {error}</div>}

      <button className="btn btn-ghost" onClick={onClose}>
        稍后再说，先回去看看
      </button>
    </div>
  );
}
