/**
 * Project Detail Layout
 * - 프로젝트 상세 페이지 공통 레이아웃
 * - 프로젝트 ID 기반 데이터 제공
 * 
 * TODO:
 * - [ ] 프로젝트 데이터 조회 (API)
 * - [ ] 프로젝트 탭 네비게이션
 * - [ ] 프로젝트 상태 표시
 * - [ ] 404 처리 (존재하지 않는 프로젝트)
 */

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  // TODO: 프로젝트 ID로 데이터 조회
  const projectId = params.id;

  return (
    <div className="min-h-screen">
      {/* TODO: 프로젝트 헤더 (이름, 상태, 탭 네비게이션) */}
      {children}
    </div>
  );
}
