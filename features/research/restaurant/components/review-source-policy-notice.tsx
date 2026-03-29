/**
 * Review Source Policy Notice - HubSpot Enterprise Style
 * 
 * 리뷰 입력 정책 안내 컴포넌트
 * @policy: 자동 크롤링 금지, 사용자 입력만 허용
 */

export function ReviewSourcePolicyNotice() {
  return (
    <div 
      className="flex items-start gap-2 p-3 rounded-md text-xs"
      style={{ backgroundColor: 'var(--workspace-secondary)', color: 'var(--text-tertiary)' }}
    >
      <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>info</span>
      <div>
        <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>리뷰 입력 정책</p>
        <p>자동 크롤링은 금지되어 있습니다. 다음 방식으로만 리뷰를 입력할 수 있습니다:</p>
        <ul className="mt-1 space-y-0.5 list-disc list-inside">
          <li>직접 방문 후 경험한 내용</li>
          <li>점주가 직접 제공한 정보</li>
          <li>사전 허가를 받은 소스의 내용</li>
        </ul>
      </div>
    </div>
  )
}
