"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { contractsConfigured } from "@/lib/wagmi";

const TABS = [
  { href: "/", label: "🌍 星球冒险", exact: true },
  { href: "/growth", label: "🗺️ 成长记录", exact: false },
  { href: "/contributors", label: "🌟 贡献者大厅", exact: false },
  { href: "/about", label: "💡 关于", exact: false },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fk-nav">
      <div className="fk-nav-inner">
        <Link href="/" className="fk-nav-logo">
          🌍 未来小孩
        </Link>
        <div className="fk-nav-links">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href} className={`fk-nav-link ${active ? "active" : ""}`}>
                {t.label}
              </Link>
            );
          })}
        </div>
        <div className="fk-nav-wallet">
          {contractsConfigured ? (
            <ConnectButton />
          ) : (
            <span className="fk-nav-demo" title="进度保存在本设备 · 连接钱包可写入以太坊">
              🌱 Demo 模式
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
