/**
 * Root Layout
 * - 전체 앱의 최상위 레이아웃
 * - 폰트, 메타데이터, 글로벌 프로바이더 설정
 * 
 * TODO:
 * - [ ] Inter 폰트 로컬 설치 또는 next/font 최적화
 * - [ ] 다크모드 프로바이더 연결
 * - [ ] React Query Provider 설정
 * - [ ] Zustand Store Provider 설정
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlogAI - AI 블로그 작성 도우미",
  description: "AI로 블로그 리서치부터 작성, 이미지 생성까지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Google Fonts - Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        {/* Material Icons */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
        />
      </head>
      <body className="font-body antialiased bg-surface text-on-surface">
        {/* TODO: Providers 추가 (React Query, Zustand, Theme) */}
        {children}
      </body>
    </html>
  );
}
