/**
 * Draft Editor Layout
 * - Editor 전용 레이아웃
 * - Server Component로 유지, 상태는 Client Wrapper에 위임
 */

import { DraftEditorLayoutClient } from './components/DraftEditorLayoutClient'

export default function DraftEditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server Component 유지, Client 상태는 wrapper에서 처리
  return <DraftEditorLayoutClient>{children}</DraftEditorLayoutClient>
}
