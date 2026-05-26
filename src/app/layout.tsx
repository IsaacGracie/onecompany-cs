import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "一人公司客服系统",
  description: "轻量级客户管理与 AI 接待系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b bg-background">
          <div className="mx-auto flex h-12 max-w-5xl items-center gap-6 px-4">
            <Link href="/" className="text-sm font-semibold">
              客服系统
            </Link>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-foreground">
                首页
              </Link>
              <Link
                href="/customers"
                className="transition-colors hover:text-foreground"
              >
                客户
              </Link>
              <Link
                href="/knowledge"
                className="transition-colors hover:text-foreground"
              >
                知识库
              </Link>
            </div>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
