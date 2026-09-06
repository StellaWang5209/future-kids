"use client";

import React, { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { contractsConfigured } from "@/lib/wagmi";
import { useProgress } from "@/lib/progress";

const AVATARS = ["🦊", "🐼", "🐙", "🦉", "🐝", "🦖", "🐬", "🦄", "🐢", "🐧", "🦁", "🐨"];

/**
 * Step 1 of the journey: create a private digital identity.
 *
 * Privacy by design — we only ever ask for a made-up nickname. No real name,
 * no birthday, no school. On-chain this becomes just a wallet address +
 * pseudonym string; nobody can link it to a real child.
 */
export function IdentityCreation({ onCreate }: { onCreate: () => void }) {
  const { address, isConnected } = useAccount();
  const { setIdentity } = useProgress();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [touched, setTouched] = useState(false);

  const byteLen = useMemo(() => new TextEncoder().encode(name).length, [name]);
  const valid = name.trim().length > 0 && byteLen <= 32;

  function create() {
    setTouched(true);
    if (!valid) return;
    setIdentity({
      pseudonym: name.trim(),
      avatar,
      createdAt: new Date().toISOString(),
      demo: !(contractsConfigured && isConnected && Boolean(address)),
    });
    onCreate();
  }

  return (
    <div className="identity-create">
      <div className="identity-hero">
        <div className="identity-orb">{avatar}</div>
        <h1>创造你的数字身份</h1>
        <p className="identity-sub">
          在未来星球上，每个人用一个化名探索。链上只会记录这串化名和一枚数字徽章 ——
          <strong>不记录真实姓名、生日或学校</strong>，这是隐私设计写进代码里的承诺。
        </p>
      </div>

      <label className="field-label" htmlFor="pseudonym">
        1️⃣ 给自己起一个探险化名
      </label>
      <input
        id="pseudonym"
        className="field-input"
        placeholder="例如：星星骑士、代码小海豚…"
        value={name}
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
      />
      <div className={`field-meta ${byteLen > 32 ? "over" : ""}`}>
        {byteLen}/32 字节（一个汉字占 3 字节）
        {touched && !valid && (
          <span className="field-error">{name.trim() ? " 太长啦，换个短一点的吧" : " 化名不能为空哦"}</span>
        )}
      </div>

      <label className="field-label">2️⃣ 挑选你的守护形象</label>
      <div className="avatar-grid">
        {AVATARS.map((a) => (
          <button
            key={a}
            className={`avatar-opt ${a === avatar ? "picked" : ""}`}
            onClick={() => setAvatar(a)}
            aria-label={`选择形象 ${a}`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="privacy-card">
        🛡️ <strong>隐私承诺</strong>：链上身份 = 钱包地址 + 化名。没有任何字段与真实世界的小朋友挂钩。
        未来的 Guardian 模式会让家长在链下管理密钥，孩子只管冒险。
      </div>

      <button className="btn btn-big" onClick={create}>
        🚀 启程，进入未来星球
      </button>
    </div>
  );
}
