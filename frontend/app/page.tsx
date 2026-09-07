"use client";

import React, { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { CHAPTERS, type Chapter } from "@/lib/chapters";
import { useProgress } from "@/lib/progress";
import { contractsConfigured } from "@/lib/wagmi";
import { IdentityCreation } from "@/components/IdentityCreation";
import { PlanetMap } from "@/components/PlanetMap";
import { GrowthMap } from "@/components/GrowthMap";
import { CompletionPanel } from "@/components/CompletionPanel";
import { BlockchainGame } from "@/components/games/BlockchainGame";
import { BitcoinGame } from "@/components/games/BitcoinGame";
import { PowGame } from "@/components/games/PowGame";
import { PosGame } from "@/components/games/PosGame";
import { EthereumGame } from "@/components/games/EthereumGame";

type Screen = "landing" | "identity" | "map" | "game" | "game-done" | "growth";

function GameFor({ chapter, onComplete }: { chapter: Chapter; onComplete: () => void }) {
  switch (chapter.id) {
    case 1:
      return <BlockchainGame chapter={chapter} onComplete={onComplete} />;
    case 2:
      return <BitcoinGame chapter={chapter} onComplete={onComplete} />;
    case 3:
      return <PowGame chapter={chapter} onComplete={onComplete} />;
    case 4:
      return <PosGame chapter={chapter} onComplete={onComplete} />;
    case 5:
      return <EthereumGame chapter={chapter} onComplete={onComplete} />;
    default:
      return null;
  }
}

export default function Home() {
  const { progress, hydrated } = useProgress();
  const { isConnected } = useAccount();
  const [screen, setScreen] = useState<Screen>("landing");
  const [chapterId, setChapterId] = useState<number | null>(null);

  // Returning explorers skip straight to their planet map
  useEffect(() => {
    if (hydrated && progress.identity && screen === "landing") {
      setScreen("map");
    }
  }, [hydrated, progress.identity, screen]);

  if (!hydrated) {
    return (
      <main className="boot">
        <div className="boot-star">✦</div>
        <p>正在唤醒未来星球…</p>
      </main>
    );
  }

  const chapter = chapterId ? CHAPTERS.find((c) => c.id === chapterId) ?? null : null;

  // ---------- Landing ----------
  if (screen === "landing") {
    return (
      <main className="landing">
        <div className="stars">✦ ⋆ ✦ ⋆ ✦</div>
        <h1 className="landing-logo">🌍 未来星球</h1>
        <p className="landing-tagline">Future Kids · 一场属于孩子的链上数字文明冒险</p>
        <p className="landing-desc">
          五个世界、五次冒险：从区块链、比特币、PoW、PoS，一路闯到以太坊与智能合约。
          每一份努力都会变成一枚<strong>永久绑定、无法买卖</strong>的成长徽章 ——
          因为知识不属于市场，它属于你。
        </p>
        <div className="landing-actions">
          <button className="btn btn-big" onClick={() => setScreen("identity")}>
            🚀 开始冒险（无需钱包）
          </button>
        </div>
        <div className="landing-wallet">
          {contractsConfigured ? (
            <ConnectButton />
          ) : (
            <p className="landing-note">
              🌱 Demo 模式：进度保存在本设备。监护人可连接钱包把成长记录写入以太坊测试网。
              {isConnected ? " （钱包已连接）" : ""}
            </p>
          )}
        </div>
        <footer className="landing-footer">
          开源公共物品 · MIT License · 不是金融产品，没有代币，没有投资
        </footer>
      </main>
    );
  }

  // ---------- Identity creation ----------
  if (screen === "identity") {
    return (
      <main className="screen">
        <IdentityCreation onCreate={() => setScreen("map")} />
      </main>
    );
  }

  // ---------- Game ----------
  if (screen === "game" && chapter) {
    return (
      <main className="screen">
        <div className="chapter-head" style={{ ["--pc" as string]: chapter.color }}>
          <button className="btn btn-ghost" onClick={() => setScreen("map")}>
            ← 返回地图
          </button>
          <h1>
            {chapter.emoji} {chapter.title}
          </h1>
        </div>
        <GameFor chapter={chapter} onComplete={() => setScreen("game-done")} />
      </main>
    );
  }

  // ---------- Completion ceremony ----------
  if (screen === "game-done" && chapter) {
    return (
      <main className="screen">
        <CompletionPanel chapter={chapter} onClose={() => setScreen("map")} />
      </main>
    );
  }

  // ---------- Growth ----------
  if (screen === "growth") {
    return (
      <main className="screen">
        <GrowthMap onBack={() => setScreen("map")} onEnterChapter={(id) => { setChapterId(id); setScreen("game"); }} />
      </main>
    );
  }

  // ---------- Planet map (default) ----------
  return (
    <main className="screen">
      <PlanetMap
        onEnterChapter={(c) => {
          setChapterId(c.id);
          setScreen("game");
        }}
        onOpenGrowth={() => setScreen("growth")}
      />
    </main>
  );
}
