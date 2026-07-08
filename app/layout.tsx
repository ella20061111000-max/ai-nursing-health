import type { Metadata } from "next"
import "./globals.css"
import Nav from "@/components/Nav"

export const metadata: Metadata = {
  title: "护理健康管家 | AI Nursing Health Companion",
  description: "基于护理程序的 AI 健康管理平台 — 记录饮食、睡眠、运动，获得个性化 AI 护理建议",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 font-sans">
        <Nav />
        <main className="flex-1">
          {children}
        </main>
        <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100">
          AI Nursing Health Companion · 护理健康管家
        </footer>
      </body>
    </html>
  )
}
