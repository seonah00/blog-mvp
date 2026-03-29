/**
 * Project Detail Layout
 * - 프로젝트 상세 페이지 공통 레이아웃
 * - 프로젝트 ID 기반 데이터 제공
 */

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
