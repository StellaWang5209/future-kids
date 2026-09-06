import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import "./games.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "未来小孩 Future Kids — 链上数字文明教育",
  description:
    "A blockchain-native digital civilization education platform for children. Open source, free, a public good. 让孩子拥有自己的数字身份、学习证明，理解未来互联网。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
