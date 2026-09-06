"use client";

import Link from "next/link";
import { GrowthMap } from "@/components/GrowthMap";
import { useAccount, useReadContract } from "wagmi";
import {
  contractAddresses,
  contractsConfigured,
} from "@/lib/wagmi";
import { identityAbi, proofAbi, badgeAbi } from "@/lib/abis";
import { LEVELS } from "@/lib/chapters";

/** Live on-chain snapshot of the connected learner — only rendered when wallet + contracts exist. */
function OnChainSnapshot() {
  const { address, chain } = useAccount();

  if (!contractsConfigured || !address) return null;

  return <Snapshot address={address} chainName={chain?.name ?? ""} />;
}

function Snapshot({ address, chainName }: { address: `0x${string}`; chainName: string }) {
  const { data: proofCount } = useReadContract({
    address: contractAddresses.proof as `0x${string}`,
    abi: proofAbi,
    functionName: "completionCount",
    args: [address],
  });
  const { data: tokenId } = useReadContract({
    address: contractAddresses.identity as `0x${string}`,
    abi: identityAbi,
    functionName: "identityOf",
    args: [address],
  });
  const { data: badgeBalance } = useReadContract({
    address: contractAddresses.badge as `0x${string}`,
    abi: badgeAbi,
    functionName: "balanceOf",
    args: [address],
  });

  const hasIdentity = typeof tokenId === "bigint" && tokenId > 0n;

  return (
    <section className="snapshot card">
      <h2>⛓️ 链上快照（实时读取）</h2>
      <p className="snapshot-net">
        网络：<b>{chainName || "未连接"}</b> · 钱包 <code>{address.slice(0, 6)}…{address.slice(-4)}</code>
      </p>
      <div className="snapshot-grid">
        <div className="snapshot-item">
          <div className="snapshot-num">{proofCount !== undefined ? Number(proofCount) : "—"}</div>
          <div className="snapshot-label">学习证明</div>
        </div>
        <div className="snapshot-item">
          <div className="snapshot-num">{badgeBalance !== undefined ? Number(badgeBalance) : "—"}</div>
          <div className="snapshot-label">Soulbound 徽章</div>
        </div>
        <div className="snapshot-item">
          <div className="snapshot-num">{hasIdentity ? `#${tokenId!.toString()}` : "—"}</div>
          <div className="snapshot-label">链上身份</div>
        </div>
      </div>
      {hasIdentity && <IdentityDetails tokenId={tokenId!} />}
      <p className="snapshot-note">
        以上数据直接从智能合约读取，任何人可在 Etherscan 独立验证 —— 且不含任何真实个人信息。
      </p>
    </section>
  );
}

function IdentityDetails({ tokenId }: { tokenId: bigint }) {
  const { data: pseudonym } = useReadContract({
    address: contractAddresses.identity as `0x${string}`,
    abi: identityAbi,
    functionName: "pseudonymOf",
    args: [tokenId],
  });
  const { data: level } = useReadContract({
    address: contractAddresses.identity as `0x${string}`,
    abi: identityAbi,
    functionName: "levelOf",
    args: [tokenId],
  });
  const lv = typeof level === "number" ? level : 0;
  const levelInfo = LEVELS.find((l) => l.min === lv);

  return (
    <div className="snapshot-identity">
      🪪 身份 #{tokenId.toString()}
      {pseudonym ? ` · 「${pseudonym}」` : ""} · {levelInfo ? `${levelInfo.emoji} ${levelInfo.name}` : `等级 ${lv}`}
    </div>
  );
}

export default function GrowthPage() {
  return (
    <main className="page">
      <GrowthMap />
      <OnChainSnapshot />
      <section className="card growth-share">
        <h2>🎁 分享成长故事</h2>
        <p>把这份学习故事送给在乎的人 —— 它会一直保存在那里，无法被任何人夺走。</p>
        <div className="growth-share-actions">
          <Link href="/" className="btn">
            🚀 继续冒险
          </Link>
          <Link href="/contributors" className="btn btn-ghost">
            🌟 帮助建设未来星球
          </Link>
        </div>
      </section>
    </main>
  );
}
