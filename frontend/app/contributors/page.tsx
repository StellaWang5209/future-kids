"use client";

import React, { useEffect, useState } from "react";
import { CATEGORIES, SEED_LEADERS, loadMyContributions, saveMyContribution, type MyContribution } from "@/lib/contributions";

/**
 * 贡献者大厅 — the ContributionRegistry comes to life.
 *
 * 公共物品靠社区共建：代码、翻译、教育、设计、社区五类贡献都会被记录。
 * Demo 模式下提交保存在本地；正式部署后由平台（RECORDER_ROLE）审核后写入链上贡献登记处，
 * 与学习记录一样：只记贡献内容哈希与积分，不记任何个人信息。
 */

export default function ContributorsPage() {
  const [mine, setMine] = useState<MyContribution[]>([]);
  const [categoryId, setCategoryId] = useState(0);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => setMine(loadMyContributions()), []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const c: MyContribution = {
      id: `${Date.now()}`,
      categoryId,
      title: title.trim(),
      detail: detail.trim(),
      submittedAt: Date.now(),
    };
    saveMyContribution(c);
    setMine(loadMyContributions());
    setTitle("");
    setDetail("");
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2500);
  }

  return (
    <main className="page">
      <header className="page-hero">
        <h1 className="page-title">🌟 贡献者大厅</h1>
        <p className="page-sub">
          未来星球是一座<b>公共物品</b>：免费、开源、属于每一个人。
          它由全世界的建设者一起搭建 —— 每一份贡献都会被永远记住。
        </p>
      </header>

      <section className="cat-grid">
        {CATEGORIES.map((c) => {
          const count = mine.filter((m) => m.categoryId === c.id).length;
          return (
            <button
              key={c.id}
              className={`cat-card ${categoryId === c.id ? "selected" : ""}`}
              onClick={() => setCategoryId(c.id)}
              type="button"
            >
              <span className="cat-emoji">{c.emoji}</span>
              <b>{c.name}</b>
              <span className="cat-en">{c.nameEn}</span>
              <span className="cat-desc">{c.desc}</span>
              {count > 0 && <span className="cat-count">我的贡献 ×{count}</span>}
            </button>
          );
        })}
      </section>

      <section className="card contrib-submit">
        <h2>✍️ 提交我的贡献</h2>
        <form onSubmit={submit}>
          <label className="contrib-label">
            贡献类型
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}（{c.nameEn}）
                </option>
              ))}
            </select>
          </label>
          <label className="contrib-label">
            做了什么？
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：帮忙翻译了第一章 / 修好了一个 bug"
              maxLength={60}
              required
            />
          </label>
          <label className="contrib-label">
            详细描述（可选）
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="链接、过程、成果……"
              rows={3}
              maxLength={280}
            />
          </label>
          <button className="btn btn-big" type="submit">
            📮 提交贡献
          </button>
          {justSubmitted && <span className="status-pill ok pop-in">✓ 已记录！审核通过后将写入链上贡献登记处</span>}
        </form>
        <p className="contrib-note">
          🔒 隐私说明：链上只保存贡献内容的哈希与积分，<b>不保存姓名、邮箱等任何个人信息</b>。
          Demo 模式下提交仅保存在本设备。
        </p>
      </section>

      {mine.length > 0 && (
        <section className="card">
          <h2>📨 我的提交（{mine.length}）</h2>
          <ul className="mine-list">
            {mine.map((m) => {
              const cat = CATEGORIES[m.categoryId];
              return (
                <li key={m.id} className="mine-item">
                  <span className="mine-emoji">{cat?.emoji}</span>
                  <div>
                    <div className="mine-title">{m.title}</div>
                    <div className="mine-meta">
                      {new Date(m.submittedAt).toLocaleString("zh-CN")} · {cat?.name}
                    </div>
                  </div>
                  <span className="status-pill">审核中</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="card">
        <h2>🏆 建设者排行榜</h2>
        <p className="contrib-note">展示社区贡献积分（演示数据 · 正式版由链上贡献登记处与索引服务提供）。</p>
        <ol className="leader-board">
          {SEED_LEADERS.map((l) => {
            const cat = CATEGORIES[l.categoryId];
            return (
              <li key={l.rank} className="leader-row">
                <span className="leader-rank">#{l.rank}</span>
                <span className="leader-emoji">{l.emoji}</span>
                <div className="leader-info">
                  <div className="leader-name">{l.name}</div>
                  <div className="leader-note">{l.note}</div>
                </div>
                <span className="leader-cat">{cat?.emoji} {cat?.name}</span>
                <span className="leader-points">{l.points} 分</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="card how-it-works">
        <h2>⚙️ 贡献如何上链？</h2>
        <ol className="how-steps">
          <li>你在这里提交贡献描述；</li>
          <li>社区审核员确认真实有效；</li>
          <li>平台用 <code>RECORDER_ROLE</code> 把「内容哈希 + 积分 + 分类」写入 <code>ContributionRegistry</code> 合约；</li>
          <li>记录永久公开、可验证、无法篡改 —— 但依然不含任何个人信息。</li>
        </ol>
      </section>
    </main>
  );
}
