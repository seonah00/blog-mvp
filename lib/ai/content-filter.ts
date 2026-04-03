/**
 * Content Filter - 금지어 검사 및 자동 수정
 * 
 * 블로그 초안 생성 후 금지어 포함 여부를 검사하고,
 * 발견 시 안전한 대체어로 자동 수정합니다.
 */

export interface BannedTermCheckResult {
  /** 발견된 금지어 배열 (중복 포함) */
  bannedTermsFound: Array<{
    term: string
    line: number
    context: string
    position: number
  }>
  /** 총 발견 개수 */
  bannedTermsCount: number
  /** 검사 결과 상태 */
  bannedTermsStatus: 'pass' | 'fail'
  /** 수정 요약 */
  bannedTermsFixSummary: string[]
  /** 수정된 본문 */
  fixedContent: string
}

// ============================================
// 금지어 목록 (카테고리별)
// ============================================

const MEDICAL_BANNED_TERMS = [
  '시술', '치료', '무절개', '최소절개', '무통증',
  '임플란트', '질환', '질병', '의료', '예방', '내원',
  '의사', '의료기기', '병원', '수술', '성형', '의약품',
  '완치', '치료경험담', '시술후기', '선정의료기관', '전문가',
]

const FINANCE_BANNED_TERMS = [
  '보험', '대부업', '대출', '저금리', '금리', '햇살론',
  '신용', '키드', '재무설계',
  '수수료', '보상', '카드론', '수익', '코인',
  '캐피탈', '금융', '계좌', '이자', '펀드',
]

const MARKETING_BANNED_TERMS = [
  '확실', '가장', '제일', '최신의', '최고의',
  '최상의', '최소한', '부작용없이', '안전한',
  '확률적으로', '0%', '100%', '보장', '정확',
  '추천', '추천인',
  '최고', '최초', '최대', '최상', '강추',
  '1등', '장담', '할인', '묣료', '공짜',
  '대박', '최저가', '배송', '총알', '특급배송',
  '직구', '공구', '구매대행', '이벤트', '대행',
  '상담', '바로가기', '연락처', '이메일',
  '전화', '다운로드',
  '가입', '빠른곳', '저렴한곳', '잘하는 곳',
]

const ILLEGAL_BANNED_TERMS = [
  '마약', '총기', '도검', '폭약', '음란물', '점집',
  '해킹', '개인정보', '이미테이션', '도박',
  '다이어트 의약품', '담술', '건강기능식품',
  '문신', '성형', '시술',
]

// 통합 금지어 목록
const ALL_BANNED_TERMS = [
  ...MEDICAL_BANNED_TERMS,
  ...FINANCE_BANNED_TERMS,
  ...MARKETING_BANNED_TERMS,
  ...ILLEGAL_BANNED_TERMS,
]

// 중복 제거 및 정렬 (긴 단어 우선)
const BANNED_TERMS = [...new Set(ALL_BANNED_TERMS)].sort((a, b) => b.length - a.length)

// ============================================
// 대체어 사전
// ============================================

const REPLACEMENT_MAP: Record<string, string | string[]> = {
  // 의료/건강
  '시술': '케어',
  '치료': ['관리', '케어', '개선'],
  '무절개': '부담 없는',
  '최소절개': '정밀',
  '무통증': '편안한',
  '임플란트': '보철',
  '질환': '건강 문제',
  '질병': '건강 문제',
  '의료': '건강',
  '예방': '관리',
  '내원': '방문',
  '의사': '전문의',
  '의료기기': '케어 기기',
  '병원': '의료기관',
  '수술': '처치',
  '성형': '미용',
  '의약품': '약물',
  '완치': '호전',
  '치료경험담': '케어 후기',
  '시술후기': '케어 후기',
  '선정의료기관': '우수 의료기관',
  
  // 금융
  '보험': '보장',
  '대부업': '금융 서비스',
  '대출': '자금 지원',
  '저금리': '합리적인 조건',
  '금리': '비용',
  '햇살론': '정부 지원 자금',
  '신용': '신뢰도',
  '키드': '세무 서비스',
  '재무설계': '자산 관리',
  '수수료': '수수',
  '보상': '보장금',
  '카드론': '신용 대출',
  '수익': '수익률',
  '코인': '가상자산',
  '캐피탈': '금융사',
  '금융': '재테크',
  '계좌': '계정',
  '이자': '수익',
  '펀드': '투자 상품',
  
  // 마케팅/과장
  '확실': '확실한 것으로 보이는',
  '가장': '매우',
  '제일': '매우',
  '최신의': '새로운',
  '최고의': '우수한',
  '최상의': '우수한',
  '최소한': '적어도',
  '부작용없이': '안심하고',
  '안전한': '검증된',
  '확률적으로': '경우에 따라',
  '0%': '거의 없는',
  '100%': '매우 높은',
  '보장': '약속',
  '정확': '정확한 것으로',
  '추천': '안내',
  '추천인': '소개인',
  '최고': '우수',
  '최초': '처음',
  '최대': '최대한',
  '최상': '우수',
  '강추': '추천',
  '1등': '우수',
  '장담': '약속',
  '할인': '특가',
  '묣료': '무상',
  '공짜': '묣료',
  '대박': '성공',
  '최저가': '좋은 가격',
  '배송': '발송',
  '총알': '빠른',
  '특급배송': '빠른 발송',
  '직구': '해외 구매',
  '공구': '단체 구매',
  '구매대행': '구매 대행',
  '이벤트': '행사',
  '대행': '대행 서비스',
  '상담': '문의',
  '바로가기': '링크',
  '연락처': '연락',
  '이메일': '메일',
  '전화': '연락',
  '다운로드': '내려받기',
  '가입': '등록',
  '빠른곳': '효율적인 곳',
  '저렴한곳': '합리적인 곳',
  '잘하는 곳': '전문가',
  
  // 불법/유해
  '마약': '불법 약물',
  '총기': '무기',
  '도검': '날붙이',
  '폭약': '위험물',
  '음란물': '유해 콘텐츠',
  '점집': '무속',
  '해킹': '불법 접근',
  '개인정보': '민감 정보',
  '이미테이션': '모조품',
  '도박': '게임',
  '다이어트 의약품': '다이어트 보조제',
  '담술': '흡연·음주',
  '건강기능식품': '건강식품',
  '문신': '타투',
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 정규화된 텍스트 생성 (공백/줄바꿈/문장부호 제거)
 */
function normalizeText(text: string): string {
  return text
    .replace(/[\s\n\r\t]+/g, '') // 모든 공백 제거
    .replace(/[.,!?;:'"()[\]{}]/g, '') // 문장부호 제거
}

/**
 * 문장 분리 함수
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

/**
 * 대체어 선택 (랜덤 또는 순환)
 */
function getReplacement(term: string, index: number = 0): string {
  const replacement = REPLACEMENT_MAP[term]
  if (!replacement) return '[검토 필요]'
  
  if (Array.isArray(replacement)) {
    return replacement[index % replacement.length]
  }
  return replacement
}

// ============================================
// 금지어 검사 함수
// ============================================

/**
 * 금지어 검사
 * @param content 검사할 본문
 * @returns 검사 결과
 */
export function checkBannedTerms(content: string): BannedTermCheckResult {
  const sentences = splitIntoSentences(content)
  const found: Array<{
    term: string
    line: number
    context: string
    position: number
  }> = []
  
  // 각 문장 검사
  sentences.forEach((sentence, lineIndex) => {
    const normalizedSentence = normalizeText(sentence)
    
    BANNED_TERMS.forEach(term => {
      const normalizedTerm = normalizeText(term)
      
      // 정규화된 텍스트에서 검색
      if (normalizedSentence.includes(normalizedTerm)) {
        // 원본 문장에서 위치 찾기
        let position = content.indexOf(sentence)
        if (position === -1) {
          // 문장이 정확히 일치하지 않으면 라인 번호 기반 추정
          position = lineIndex * 100
        }
        
        found.push({
          term,
          line: lineIndex + 1,
          context: sentence.length > 100 
            ? sentence.substring(0, 100) + '...' 
            : sentence,
          position,
        })
      }
    })
  })
  
  return {
    bannedTermsFound: found,
    bannedTermsCount: found.length,
    bannedTermsStatus: found.length === 0 ? 'pass' : 'fail',
    bannedTermsFixSummary: [],
    fixedContent: content,
  }
}

// ============================================
// 금지어 수정 함수
// ============================================

/**
 * 금지어를 안전한 대체어로 수정
 * @param content 원본 본문
 * @returns 수정된 결과
 */
export function fixBannedTerms(content: string): BannedTermCheckResult {
  let fixedContent = content
  const fixSummary: string[] = []
  
  // 각 금지어에 대해 수정
  BANNED_TERMS.forEach((term, termIndex) => {
    // 정규식으로 단어 경계 고려하여 검색 (단, 한글은 word boundary가 다르므로 유의)
    const regex = new RegExp(term, 'gi')
    
    if (regex.test(fixedContent)) {
      const replacement = getReplacement(term, termIndex)
      const matches = fixedContent.match(regex)
      const matchCount = matches ? matches.length : 0
      
      if (matchCount > 0) {
        fixSummary.push(`${term} → ${replacement} (${matchCount}회)`)
        fixedContent = fixedContent.replace(regex, replacement)
      }
    }
  })
  
  // 수정 후 재검사
  const recheck = checkBannedTerms(fixedContent)
  
  return {
    bannedTermsFound: recheck.bannedTermsFound,
    bannedTermsCount: recheck.bannedTermsCount,
    bannedTermsStatus: recheck.bannedTermsStatus,
    bannedTermsFixSummary: fixSummary,
    fixedContent,
  }
}

/**
 * 금지어 검사 및 수정 (재검사 포함)
 * @param content 원본 본문
 * @returns 최종 검사 결과 (금지어 0개 보장)
 */
export function validateAndFixContent(content: string): BannedTermCheckResult {
  // 1차 검사 및 수정
  let result = fixBannedTerms(content)
  
  // 금지어가 남아있으면 재수정 (최대 3회)
  let attempts = 0
  const maxAttempts = 3
  
  while (result.bannedTermsStatus === 'fail' && attempts < maxAttempts) {
    // 남은 금지어에 대해 추가 수정 로직
    const additionalFixes: string[] = []
    
    result.bannedTermsFound.forEach((found) => {
      // 대체어가 없는 경우 기본 대체어 적용
      if (!REPLACEMENT_MAP[found.term]) {
        const genericReplacement = '[표현 수정 필요]'
        result.fixedContent = result.fixedContent.replace(
          new RegExp(found.term, 'gi'),
          genericReplacement
        )
        additionalFixes.push(`${found.term} → ${genericReplacement}`)
      }
    })
    
    // 재검사
    result = fixBannedTerms(result.fixedContent)
    result.bannedTermsFixSummary = [...result.bannedTermsFixSummary, ...additionalFixes]
    
    attempts++
  }
  
  // 최종 상태 확정
  result.bannedTermsStatus = result.bannedTermsCount === 0 ? 'pass' : 'fail'
  
  return result
}

// ============================================
// Draft 출력 포맷용 인터페이스
// ============================================

export interface DraftWithFilterResult {
  title: string
  content: string
  filterResult: BannedTermCheckResult
  sections?: Array<{
    heading: string
    content: string
  }>
  faq?: Array<{
    question: string
    answer: string
  }>
  keywordsUsed?: string[]
  metadata?: {
    wordCount: number
    estimatedReadTime: number
    tone: string
  }
  usedFallback?: boolean
}

/**
 * 초안에 필터 적용
 */
export function applyContentFilter(draft: {
  title: string
  content: string
  sections?: Array<{ heading: string; content: string }>
  faq?: Array<{ question: string; answer: string }>
  keywordsUsed?: string[]
  metadata?: { wordCount: number; estimatedReadTime: number; tone: string }
  usedFallback?: boolean
}): DraftWithFilterResult {
  // 본문 필터링
  const filterResult = validateAndFixContent(draft.content)
  
  // 섹션별 필터링
  const filteredSections = draft.sections?.map(section => ({
    heading: section.heading,
    content: validateAndFixContent(section.content).fixedContent,
  }))
  
  // FAQ 필터링
  const filteredFaq = draft.faq?.map(item => ({
    question: validateAndFixContent(item.question).fixedContent,
    answer: validateAndFixContent(item.answer).fixedContent,
  }))
  
  return {
    title: draft.title,
    content: filterResult.fixedContent,
    filterResult,
    sections: filteredSections,
    faq: filteredFaq,
    keywordsUsed: draft.keywordsUsed,
    metadata: draft.metadata,
    usedFallback: draft.usedFallback,
  }
}

// ============================================
// 로깅용 유틸리티
// ============================================

/**
 * 필터 결과를 콘솔에 출력
 */
export function logFilterResult(result: BannedTermCheckResult): void {
  console.log('\n========================================')
  console.log('금지어 검사 결과')
  console.log('========================================')
  console.log(`상태: ${result.bannedTermsStatus === 'pass' ? '✅ 통과' : '❌ 실패'}`)
  console.log(`발견된 금지어: ${result.bannedTermsCount}개`)
  
  if (result.bannedTermsFound.length > 0) {
    console.log('\n[발견된 금지어 상세]')
    result.bannedTermsFound.forEach((item, index) => {
      console.log(`  ${index + 1}. "${item.term}" (줄 ${item.line})`)
      console.log(`     문맥: ${item.context}`)
    })
  }
  
  if (result.bannedTermsFixSummary.length > 0) {
    console.log('\n[자동 수정 내역]')
    result.bannedTermsFixSummary.forEach((fix, index) => {
      console.log(`  ${index + 1}. ${fix}`)
    })
  }
  
  console.log('========================================\n')
}
