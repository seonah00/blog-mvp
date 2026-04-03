/**
 * Project Store (Zustand)
 * - persist 적용으로 새로고침 후에도 데이터 유지
 * - hydration 상태 관리 포함
 */

import { useCallback } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  CreateProjectInput,
  Draft,
  DraftSettings,
  Project,
  ResearchItem,
  ImagePrompt,
  GeneratedImage,
  ThumbnailSettings,
  // Restaurant domain types
  PlaceCandidate,
  NormalizedPlaceProfile,
  CanonicalPlace,
  UserReviewInput,
  ReviewDigest,
  RestaurantDraftSettings,
  RestaurantDraftVersion,
  RestaurantDraftGenerationMode,
  RestaurantDraftVariationPreset,
  // Informational domain types
  SourceInput,
  SourceDocument,
  InformationalOutline,
  KeyPoint,
  TopicAnalysis,
  InformationalDraftSettings,
  // Threads domain types (NEW)
  ThreadsProjectMeta,
  ThreadsDraftSettings,
  ThreadsDraftVersion,
  // Karrot domain types (NEW)
  KarrotProjectMeta,
  KarrotDraftSettings,
  KarrotDraftVersion,
} from '@/types'
import type { WebEvidence } from '@/types/evidence'
import { createId, countWords, nowIso } from '@/lib/utils'
import {
  createMockDraftFromContext,
  createMockResearchItems,
} from '@/lib/mock-data'
import { generateRestaurantDraft } from '@/lib/ai/restaurant-draft'
import { generateThreadsDraft } from '@/lib/ai/prompts/threads-draft'
import { generateKarrotDraft } from '@/lib/ai/prompts/karrot-draft'

// 참조 안정성을 위한 상수들 (React #185 오류 방지)
const EMPTY_ARRAY = Object.freeze([]) as unknown as never[]

interface ProjectStore {
  hasHydrated: boolean

  projects: Project[]
  researchItems: Record<string, ResearchItem[]>
  selectedResearchIds: Record<string, string[]>
  draftSettings: Record<string, DraftSettings>
  drafts: Record<string, Draft>
  imagePrompts: Record<string, ImagePrompt[]>
  thumbnailSettings: Record<string, ThumbnailSettings>

  // ───────────────────────────────────────────────
  // Restaurant Domain States (신규)
  // ───────────────────────────────────────────────
  /** 장소 검색 후보 */
  restaurantPlaceCandidates: Record<string, PlaceCandidate[]>
  /** Canonical 장소 목록 (검색 결과에서 병합된 데이터) */
  restaurantCanonicalPlaces: Record<string, CanonicalPlace[]>
  /** 선택된 장소 프로필 */
  restaurantSelectedPlace: Record<string, NormalizedPlaceProfile | undefined>
  /** 선택된 Canonical 장소 (구조화 데이터) */
  restaurantSelectedCanonicalPlace: Record<string, CanonicalPlace | undefined>
  /** 사용자 입력 리뷰 */
  restaurantReviewInputs: Record<string, UserReviewInput[]>
  /** 리뷰 다이제스트 */
  restaurantReviewDigest: Record<string, ReviewDigest | undefined>
  /** 웹 조사 증거 (NEW) */
  restaurantWebEvidence: Record<string, WebEvidence[]>
  /** 초안 버전 히스토리 */
  restaurantDraftVersions: Record<string, RestaurantDraftVersion[]>
  /** 현재 선택된 초안 버전 ID */
  restaurantCurrentDraftVersionId: Record<string, string | undefined>

  // ───────────────────────────────────────────────
  // Informational Domain States (신규)
  // ───────────────────────────────────────────────
  /** 소스 입력 목록 */
  informationalSources: Record<string, SourceInput[]>
  /** 처리된 소스 문서 */
  informationalSourceDocs: Record<string, SourceDocument[]>
  /** 글 개요 */
  informationalOutline: Record<string, InformationalOutline | undefined>
  /** 토픽 분석 */
  informationalTopicAnalysis: Record<string, TopicAnalysis | undefined>
  /** 핵심 포인트 */
  informationalKeyPoints: Record<string, KeyPoint[]>
  /** 초안 작성 설정 */
  informationalDraftSettings: Record<string, InformationalDraftSettings | undefined>
  /** 초안 생성 상태 (NEW) */
  informationalDraftStatus: Record<string, {
    isGenerating: boolean
    error: string | null
    progress: number
    // 8단계 세부 상태
    currentStage?: string
    stageLabel?: string
    stageIndex?: number // 0-7
  }>

  // ───────────────────────────────────────────────
  // Threads Domain States (NEW)
  // ───────────────────────────────────────────────
  /** 스레드 메타 */
  threadsMeta: Record<string, ThreadsProjectMeta | undefined>
  /** 스레드 초안 설정 */
  threadsDraftSettings: Record<string, ThreadsDraftSettings | undefined>
  /** 스레드 초안 버전 히스토리 */
  threadsDraftVersions: Record<string, ThreadsDraftVersion[]>

  // ───────────────────────────────────────────────
  // Karrot Domain States (NEW)
  // ───────────────────────────────────────────────
  /** 당근 메타 */
  karrotMeta: Record<string, KarrotProjectMeta | undefined>
  /** 당근 초안 설정 */
  karrotDraftSettings: Record<string, KarrotDraftSettings | undefined>
  /** 당근 초안 버전 히스토리 */
  karrotDraftVersions: Record<string, KarrotDraftVersion[]>

  setHasHydrated: (value: boolean) => void

  createProject: (data: CreateProjectInput) => Project
  getProject: (id: string) => Project | undefined
  updateProject: (id: string, updates: Partial<Project>) => void

  setResearchItems: (projectId: string, items: ResearchItem[]) => void
  toggleResearchSelection: (projectId: string, itemId: string) => void
  getSelectedResearchItems: (projectId: string) => ResearchItem[]

  saveDraftSettings: (projectId: string, settings: DraftSettings) => void
  getDraftSettings: (projectId: string) => DraftSettings | undefined

  createDraft: (projectId: string) => Draft | undefined
  createRestaurantDraft: (projectId: string) => Promise<Draft | undefined>
  createThreadsDraft: (projectId: string) => Promise<Draft | undefined>
  createKarrotDraft: (projectId: string) => Promise<Draft | undefined>
  getDraft: (projectId: string) => Draft | undefined
  updateDraftContent: (projectId: string, content: string) => void

  // Image Prompts
  generateImagePrompts: (projectId: string, blocks: { id: string; content: string }[]) => void
  /**
   * 서버에서 생성된 ImagePrompt 결과를 저장 (AI 계층 연동)
   * @see PROMPT_GUIDE.md Section 4
   */
  saveImagePromptsFromAI: (projectId: string, prompts: ImagePrompt[]) => void
  getImagePrompts: (projectId: string) => ImagePrompt[]
  updateImagePrompt: (projectId: string, promptId: string, updates: Partial<ImagePrompt>) => void
  selectGeneratedImage: (projectId: string, promptId: string, imageId: string) => void

  // Thumbnail
  saveThumbnailSettings: (projectId: string, settings: ThumbnailSettings) => void
  getThumbnailSettings: (projectId: string) => ThumbnailSettings | undefined

  // ───────────────────────────────────────────────
  // Restaurant Domain Actions (신규)
  // ───────────────────────────────────────────────
  setPlaceCandidates: (projectId: string, candidates: PlaceCandidate[], canonicalPlaces?: CanonicalPlace[]) => void
  getPlaceCandidates: (projectId: string) => PlaceCandidate[]
  getCanonicalPlaces: (projectId: string) => CanonicalPlace[]
  selectPlace: (projectId: string, place: NormalizedPlaceProfile, canonicalPlace?: CanonicalPlace) => void
  getSelectedPlace: (projectId: string) => NormalizedPlaceProfile | undefined
  getSelectedCanonicalPlace: (projectId: string) => CanonicalPlace | undefined
  addReviewInput: (projectId: string, review: Omit<UserReviewInput, 'id' | 'createdAt'>) => void
  getReviewInputs: (projectId: string) => UserReviewInput[]
  setReviewDigest: (projectId: string, digest: ReviewDigest) => void
  getReviewDigest: (projectId: string) => ReviewDigest | undefined
  // Web Evidence (NEW)
  addWebEvidence: (projectId: string, evidence: WebEvidence) => void
  setWebEvidence: (projectId: string, evidence: WebEvidence[]) => void
  getWebEvidence: (projectId: string) => WebEvidence[]
  removeWebEvidence: (projectId: string, evidenceId: string) => void
  clearWebEvidence: (projectId: string) => void

  // ───────────────────────────────────────────────
  // Draft Version Management (NEW)
  // ───────────────────────────────────────────────
  /** 초안 버전 추가 */
  addDraftVersion: (projectId: string, version: Omit<RestaurantDraftVersion, 'id'>) => RestaurantDraftVersion
  /** 초안 버전 목록 조회 */
  getDraftVersions: (projectId: string) => RestaurantDraftVersion[]
  /** 특정 버전 조회 */
  getDraftVersionById: (projectId: string, versionId: string) => RestaurantDraftVersion | undefined
  /** 현재 버전 ID 설정 */
  setCurrentDraftVersionId: (projectId: string, versionId: string | undefined) => void
  /** 현재 버전 ID 조회 */
  getCurrentDraftVersionId: (projectId: string) => string | undefined
  /** 현재 활성화된 버전 조회 */
  getCurrentDraftVersion: (projectId: string) => RestaurantDraftVersion | undefined
  /** 버전 라벨 업데이트 */
  updateDraftVersionLabel: (projectId: string, versionId: string, label: string) => void
  /** 버전 삭제 */
  removeDraftVersion: (projectId: string, versionId: string) => void
  /** 버전 선택 시 Draft 업데이트 */
  switchDraftVersion: (projectId: string, versionId: string) => void
  /** 현재 Draft 재생성 (같은 설정으로 새 표현) */
  regenerateRestaurantDraft: (
    projectId: string, 
    settings: RestaurantDraftSettings
  ) => Promise<RestaurantDraftVersion | null>
  /** 현재 Draft 변형 생성 (프리셋 적용) */
  createRestaurantDraftVariation: (
    projectId: string,
    settings: RestaurantDraftSettings, 
    preset: RestaurantDraftVariationPreset
  ) => Promise<RestaurantDraftVersion | null>
  
  // ───────────────────────────────────────────────
  // Informational Domain Actions (신규)
  // ───────────────────────────────────────────────
  createInformationalDraft: (projectId: string) => Promise<Draft | undefined>
  addSource: (projectId: string, source: Omit<SourceInput, 'id' | 'addedAt'>) => void
  getSources: (projectId: string) => SourceInput[]
  removeSource: (projectId: string, sourceId: string) => void
  setSourceDocument: (projectId: string, doc: SourceDocument) => void
  getSourceDocuments: (projectId: string) => SourceDocument[]
  setOutline: (projectId: string, outline: InformationalOutline) => void
  getOutline: (projectId: string) => InformationalOutline | undefined
  setTopicAnalysis: (projectId: string, analysis: TopicAnalysis) => void
  getTopicAnalysis: (projectId: string) => TopicAnalysis | undefined
  setKeyPoints: (projectId: string, keyPoints: KeyPoint[]) => void
  getKeyPoints: (projectId: string) => KeyPoint[]
  removeReviewInput: (projectId: string, reviewId: string) => void
  /** 정보성 글 초안 설정 저장 */
  saveInformationalDraftSettings: (projectId: string, settings: InformationalDraftSettings) => void
  /** 정보성 글 초안 설정 조회 */
  getInformationalDraftSettings: (projectId: string) => InformationalDraftSettings | undefined

  resetAll: () => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      hasHydrated: false,

      projects: [],
      researchItems: {},
      selectedResearchIds: {},
      draftSettings: {},
      drafts: {},
      imagePrompts: {},
      thumbnailSettings: {},

      // Restaurant Domain States 초기화 (신규)
      restaurantPlaceCandidates: {},
      restaurantCanonicalPlaces: {},
      restaurantSelectedPlace: {},
      restaurantSelectedCanonicalPlace: {},
      restaurantReviewInputs: {},
      restaurantReviewDigest: {},
      restaurantWebEvidence: {},
      restaurantDraftVersions: {},
      restaurantCurrentDraftVersionId: {},

      // Informational Domain States 초기화 (신규)
      informationalSources: {},
      informationalSourceDocs: {},
      informationalOutline: {},
      informationalTopicAnalysis: {},
      informationalKeyPoints: {},
      informationalDraftSettings: {},
      informationalDraftStatus: {},

      // Threads Domain States 초기화 (NEW)
      threadsMeta: {},
      threadsDraftSettings: {},
      threadsDraftVersions: {},

      // Karrot Domain States 초기화 (NEW)
      karrotMeta: {},
      karrotDraftSettings: {},
      karrotDraftVersions: {},

      setHasHydrated: (value) => set({ hasHydrated: value }),

      createProject: (data) => {
        const project: Project = {
          id: createId('project'),
          type: data.type,
          title: data.title.trim(),
          topic: data.topic.trim(),
          targetAudience: data.targetAudience.trim(),
          tone: data.tone,
          keywords: data.keywords,
          status: 'researching',
          createdAt: nowIso(),
          updatedAt: nowIso(),
          // 타입별 메타데이터 저장
          restaurantMeta: data.restaurantMeta,
          informationalMeta: data.informationalMeta,
          threadsMeta: data.threadsMeta,
          karrotMeta: data.karrotMeta,
        }

        const research = createMockResearchItems(project)

        set((state) => ({
          projects: [project, ...state.projects],
          researchItems: {
            ...state.researchItems,
            [project.id]: research,
          },
          selectedResearchIds: {
            ...state.selectedResearchIds,
            [project.id]: research.slice(0, 2).map((item) => item.id),
          },
          // 타입별 메타 상태 저장
          ...(data.threadsMeta && {
            threadsMeta: {
              ...state.threadsMeta,
              [project.id]: data.threadsMeta,
            },
          }),
          ...(data.karrotMeta && {
            karrotMeta: {
              ...state.karrotMeta,
              [project.id]: data.karrotMeta,
            },
          }),
        }))

        return project
      },

      getProject: (id) => {
        return get().projects.find((project) => project.id === id)
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, ...updates, updatedAt: nowIso() }
              : project
          ),
        }))
      },

      setResearchItems: (projectId, items) => {
        set((state) => ({
          researchItems: {
            ...state.researchItems,
            [projectId]: items,
          },
        }))
      },

      toggleResearchSelection: (projectId, itemId) => {
        const current = get().selectedResearchIds[projectId] ?? []
        const exists = current.includes(itemId)

        const next = exists
          ? current.filter((id) => id !== itemId)
          : [...current, itemId]

        set((state) => ({
          selectedResearchIds: {
            ...state.selectedResearchIds,
            [projectId]: next,
          },
        }))
      },

      getSelectedResearchItems: (projectId) => {
        const items = get().researchItems[projectId]
        const selectedIds = get().selectedResearchIds[projectId]

        if (!items || !selectedIds) return EMPTY_ARRAY as ResearchItem[]
        return items.filter((item) => selectedIds.includes(item.id))
      },

      saveDraftSettings: (projectId, settings) => {
        set((state) => ({
          draftSettings: {
            ...state.draftSettings,
            [projectId]: settings,
          },
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  status: 'writing',
                  updatedAt: nowIso(),
                }
              : project,
          ),
        }))
      },

      getDraftSettings: (projectId) => {
        return get().draftSettings[projectId]
      },

      createDraft: (projectId) => {
        const existing = get().drafts[projectId]
        if (existing) return existing

        const project = get().getProject(projectId)
        const settings = get().getDraftSettings(projectId)
        const selectedResearch = get().getSelectedResearchItems(projectId)

        if (!project || !settings) return undefined

        // 타입별 별도 처리
        if (project.type === 'restaurant') {
          return undefined // createRestaurantDraft 사용하도록 유도
        }
        if (project.type === 'threads') {
          return undefined // createThreadsDraft 사용하도록 유도
        }
        if (project.type === 'karrot') {
          return undefined // createKarrotDraft 사용하도록 유도
        }

        // Informational 및 기타 타입은 기본 처리
        const content = createMockDraftFromContext({
          project,
          settings,
          selectedResearch,
        })

        const draft: Draft = {
          projectId,
          title: project.title,
          content,
          version: 1,
          wordCount: countWords(content),
          updatedAt: nowIso(),
          lastSavedAt: nowIso(),
        }

        set((state) => ({
          drafts: {
            ...state.drafts,
            [projectId]: draft,
          },
        }))

        return draft
      },

      /**
       * Restaurant 타입 전용 초안 생성
       * ReviewDigest와 PlaceProfile을 활용한 구조화된 초안 생성
       * 
       * NEW: canonicalPlace와 webEvidence 지원
       * 데이터 신뢰 우선순위:
       * 1. 사용자 직접 입력 (reviewDigest)
       * 2. 구조화 장소 데이터 (canonicalPlace)
       * 3. 웹 조사 데이터 (webEvidence)
       */
      createRestaurantDraft: async (projectId) => {
        const existing = get().drafts[projectId]
        if (existing) return existing

        const project = get().getProject(projectId)
        const settings = get().getDraftSettings(projectId)
        const placeProfile = get().getSelectedPlace(projectId)
        const canonicalPlace = get().getSelectedCanonicalPlace(projectId)
        const reviewDigest = get().getReviewDigest(projectId)
        const webEvidence = get().getWebEvidence(projectId)

        if (!project || !settings) return undefined
        if (project.type !== 'restaurant') return undefined

        // ReviewDigest가 없으면 기본 Draft 생성
        if (!reviewDigest || !placeProfile) {
          console.warn('[createRestaurantDraft] ReviewDigest or PlaceProfile missing, using fallback')
          const fallbackContent = `# ${project.title}

${project.topic}에 대해 작성하는 글입니다.

아직 리서치 단계에서 생성된 요약이 없습니다.
리서치 탭으로 돌아가서 매장 검색, 리뷰 입력, 요약 생성을 완료해주세요.

---

**프로젝트 정보**
- 주제: ${project.topic}
- 타겟: ${project.targetAudience}
- 톤: ${project.tone}
`
          const fallbackDraft: Draft = {
            projectId,
            title: project.title,
            content: fallbackContent,
            version: 1,
            wordCount: countWords(fallbackContent),
            updatedAt: nowIso(),
            lastSavedAt: nowIso(),
          }

          set((state) => ({
            drafts: {
              ...state.drafts,
              [projectId]: fallbackDraft,
            },
          }))

          return fallbackDraft
        }

        // RestaurantDraftSettings 변환
        const restaurantSettings: import('@/types').RestaurantDraftSettings = {
          channel: 'blog',
          tone: 'friendly',
          focusPoints: ['menu', 'atmosphere'],
        }

        // customPrompt에서 설정 추출 시도
        if (settings.customPrompt) {
          if (settings.customPrompt.includes('blog')) restaurantSettings.channel = 'blog'
          if (settings.customPrompt.includes('threads')) restaurantSettings.channel = 'threads'
          if (settings.customPrompt.includes('daangn')) restaurantSettings.channel = 'daangn'
          if (settings.customPrompt.includes('friendly')) restaurantSettings.tone = 'friendly'
          if (settings.customPrompt.includes('informative')) restaurantSettings.tone = 'informative'
          if (settings.customPrompt.includes('recommendation')) restaurantSettings.tone = 'recommendation'
        }

        // goal에서 focusPoints 추출 시도
        if (settings.goal) {
          const possiblePoints = ['menu', 'atmosphere', 'location', 'price', 'waiting', 'parking'] as const
          restaurantSettings.focusPoints = possiblePoints.filter(p => 
            settings.goal?.toLowerCase().includes(p)
          )
          if (restaurantSettings.focusPoints.length === 0) {
            restaurantSettings.focusPoints = ['menu', 'atmosphere']
          }
        }

        // 8단계 progress 초기화
        set((state) => ({
          informationalDraftStatus: {
            ...state.informationalDraftStatus,
            [projectId]: {
              isGenerating: true,
              error: null,
              progress: 0,
              currentStage: 'source-collection',
              stageLabel: '자료 수집 중',
              stageIndex: 0,
            },
          },
        }))

        try {
          // AI 초안 생성 (8단계 pipeline with progress)
          const output = await generateRestaurantDraft({
            placeProfile,
            canonicalPlace: canonicalPlace || undefined,
            reviewDigest,
            settings: restaurantSettings,
            projectTitle: project.title,
            projectTopic: project.topic,
            webEvidence: webEvidence.length > 0 ? webEvidence : undefined,
          }, (status) => {
            // Progress 콜백
            const stageLabels: Record<string, string> = {
              'source-collection': '자료 수집 중',
              'research-distillation': '핵심 내용 정리 중',
              'outline-generation': '글 구조 설계 중',
              'title-generation': '제목 생성 중',
              'body-generation': '본문 작성 중',
              'natural-rewrite': '문장 다듬는 중',
              'quality-review': '품질 검사 중',
              'draft-commit': '완료',
            }
            
            set((state) => ({
              informationalDraftStatus: {
                ...state.informationalDraftStatus,
                [projectId]: {
                  isGenerating: status.progress < 100,
                  error: null,
                  progress: status.progress,
                  currentStage: status.stage,
                  stageLabel: stageLabels[status.stage] || status.message,
                  stageIndex: ['source-collection', 'research-distillation', 'outline-generation', 'title-generation', 'body-generation', 'natural-rewrite', 'quality-review', 'draft-commit'].indexOf(status.stage),
                },
              },
            }))
          })

          const draft: Draft = {
            projectId,
            title: output.title,
            content: output.content,
            version: 1,
            wordCount: countWords(output.content),
            updatedAt: nowIso(),
            lastSavedAt: nowIso(),
          }

          set((state) => ({
            drafts: {
              ...state.drafts,
              [projectId]: draft,
            },
            informationalDraftStatus: {
              ...state.informationalDraftStatus,
              [projectId]: {
                isGenerating: false,
                error: null,
                progress: 100,
                currentStage: 'draft-commit',
                stageLabel: '완료',
                stageIndex: 7,
              },
            },
          }))

          return draft
        } catch (error) {
          console.error('[createRestaurantDraft] Failed:', error)
          
          set((state) => ({
            informationalDraftStatus: {
              ...state.informationalDraftStatus,
              [projectId]: {
                isGenerating: false,
                error: error instanceof Error ? error.message : '초안 생성 중 오류가 발생했습니다.',
                progress: 0,
                currentStage: 'error',
                stageLabel: '오류 발생',
                stageIndex: -1,
              },
            },
          }))
          
          return undefined
        }
      },

      /**
       * Threads 타입 전용 초안 생성
       * purpose(food/info/branding) + strategyType(story/tip/engage) 조합으로 프롬프트 구성
       */
      createThreadsDraft: async (projectId) => {
        const existing = get().drafts[projectId]
        if (existing) return existing

        const project = get().getProject(projectId)
        const meta = get().threadsMeta[projectId]
        const settings = get().threadsDraftSettings[projectId]

        if (!project || project.type !== 'threads') return undefined

        // AI 입력 구성
        const threadsSettings = settings || {
          purpose: meta?.purpose || 'info',
          strategyType: meta?.strategyType || 'tip',
          threadCount: 5,
          includeImages: true,
          imagePosition: 'middle' as const,
          hashtagStyle: 'moderate' as const,
          ctaType: 'none' as const,
          businessInfo: meta?.businessInfo,
        }

        // 벤치마크 링크 요약 (있는 경우)
        const benchmarkSummary = meta?.benchmarkLinks 
          ? `참고할 벤치마크: ${meta.benchmarkLinks}` 
          : undefined

        const researchData = {
          keyPoints: [
            `${project.topic}에 대한 핵심 포인트`,
            `${project.targetAudience || '독자'}를 위한 주요 내용`,
            '추가적인 인사이트와 정보',
          ],
          suggestedHooks: meta?.hook ? [meta.hook] : [
            `${project.topic} - 이거 알아두세요!`,
            `진짜 ${project.topic} 공개합니다`,
            `${project.topic}, 어떻게 생각하세요?`,
          ],
          suggestedHashtags: ['#스레드', '#정보공유', '#팔로우'],
        }

        try {
          // AI 초안 생성 - 새 구조 반영
          const output = await generateThreadsDraft({
            meta: {
              purpose: meta?.purpose || 'info',
              strategyType: meta?.strategyType || 'tip',
              targetAudience: project.targetAudience,
              tone: meta?.tone || 'casual',
              hook: meta?.hook,
              topic: project.topic,
              benchmarkLinks: benchmarkSummary,
              businessInfo: meta?.businessInfo,
            },
            research: researchData,
            settings: threadsSettings,
          })

          // Draft 형식으로 변환
          const content = [
            `# ${output.title}`,
            '',
            ...output.threads.map(t => 
              `${t.order}. ${t.content}${t.imageDescription ? `\n[이미지: ${t.imageDescription}]` : ''}`
            ),
            '',
            output.hashtags.join(' '),
          ].join('\n')

          const draft: Draft = {
            projectId,
            title: output.title,
            content,
            version: 1,
            wordCount: output.metadata.wordCount,
            updatedAt: nowIso(),
            lastSavedAt: nowIso(),
          }

          set((state) => ({
            drafts: {
              ...state.drafts,
              [projectId]: draft,
            },
          }))

          return draft
        } catch (error) {
          console.error('[createThreadsDraft] Failed:', error)
          return undefined
        }
      },

      /**
       * Karrot 타입 전용 초안 생성
       * purpose(ad/food/community)에 따라 다른 프롬프트 사용
       */
      createKarrotDraft: async (projectId) => {
        const existing = get().drafts[projectId]
        if (existing) return existing

        const project = get().getProject(projectId)
        const meta = get().karrotMeta[projectId]
        const settings = get().karrotDraftSettings[projectId]

        if (!project || project.type !== 'karrot') return undefined

        // AI 입력 구성
        const karrotSettings = settings || {
          purpose: meta?.purpose || 'community',
          includePrice: true,
          includeLocation: true,
          includeContact: true,
          emojiLevel: 'minimal' as const,
          urgency: 'none' as const,
          includeImages: true,
        }

        const researchData = {
          keyPoints: [
            `${meta?.region || '동네'} 관련 핵심 정보`,
            `${project.topic}에 대한 주요 내용`,
            '동네 주민들이 공감할 포인트',
          ],
          localKeywords: [meta?.region || '동네', '우리동네', '근처'],
          suggestedTitles: [
            `${meta?.region || '동네'} ${project.topic}`,
            `${meta?.region || '동네'} 주민분들`,
            `${project.topic} 공유해요`,
          ],
        }

        try {
          // AI 초안 생성
          const output = await generateKarrotDraft({
            meta: {
              purpose: meta?.purpose || 'community',
              region: meta?.region || '',
              targetAudience: project.targetAudience,
              businessType: meta?.businessType,
              topic: project.topic,
            },
            research: researchData,
            settings: karrotSettings,
          })

          const draft: Draft = {
            projectId,
            title: output.title,
            content: output.content + '\n\n' + output.hashtags.join(' '),
            version: 1,
            wordCount: output.metadata.wordCount,
            updatedAt: nowIso(),
            lastSavedAt: nowIso(),
          }

          set((state) => ({
            drafts: {
              ...state.drafts,
              [projectId]: draft,
            },
          }))

          return draft
        } catch (error) {
          console.error('[createKarrotDraft] Failed:', error)
          return undefined
        }
      },

      getDraft: (projectId) => {
        return get().drafts[projectId]
      },

      updateDraftContent: (projectId, content) => {
        const draft = get().drafts[projectId]
        if (!draft) return

        set((state) => ({
          drafts: {
            ...state.drafts,
            [projectId]: {
              ...draft,
              content,
              wordCount: countWords(content),
              updatedAt: nowIso(),
              lastSavedAt: nowIso(),
            },
          },
        }))
      },

      // Image Prompts
      generateImagePrompts: (projectId, blocks) => {
        // TODO: PROMPT_GUIDE.md 섹션 4 (Image Prompt 생성) 연동
        // 현재는 block.content 기반으로 간단한 prompt 생성 (placeholder)
        // 실제 연동 시:
        // const response = await fetch('/api/image-prompt', {
        //   method: 'POST',
        //   body: JSON.stringify({ blocks, projectSettings })
        // })

        const prompts: ImagePrompt[] = blocks.map((block) => ({
          id: createId('prompt'),
          projectId,
          blockId: block.id,
          prompt: `${block.content.slice(0, 100)}...를 시각화하는 이미지`,
          style: 'illustration',
          ratio: '16:9',
          status: 'pending',
          generatedImages: [],
          createdAt: nowIso(),
        }))

        set((state) => ({
          imagePrompts: {
            ...state.imagePrompts,
            [projectId]: prompts,
          },
        }))
      },

      saveImagePromptsFromAI: (projectId, prompts) => {
        set((state) => ({
          imagePrompts: {
            ...state.imagePrompts,
            [projectId]: prompts,
          },
        }))
      },

      getImagePrompts: (projectId) => {
        return get().imagePrompts[projectId] || (EMPTY_ARRAY as ImagePrompt[])
      },

      updateImagePrompt: (projectId, promptId, updates) => {
        const prompts = get().imagePrompts[projectId]
        if (!prompts) return

        set((state) => ({
          imagePrompts: {
            ...state.imagePrompts,
            [projectId]: prompts.map((p) =>
              p.id === promptId ? { ...p, ...updates } : p
            ),
          },
        }))
      },

      selectGeneratedImage: (projectId, promptId, imageId) => {
        const prompts = get().imagePrompts[projectId]
        if (!prompts) return

        set((state) => ({
          imagePrompts: {
            ...state.imagePrompts,
            [projectId]: prompts.map((p) =>
              p.id === promptId ? { ...p, selectedImageId: imageId } : p
            ),
          },
        }))
      },

      // Thumbnail
      saveThumbnailSettings: (projectId, settings) => {
        set((state) => ({
          thumbnailSettings: {
            ...state.thumbnailSettings,
            [projectId]: settings,
          },
        }))
      },

      getThumbnailSettings: (projectId) => {
        return get().thumbnailSettings[projectId]
      },

      // ───────────────────────────────────────────────
      // Restaurant Domain Actions 구현 (신규)
      // ───────────────────────────────────────────────
      setPlaceCandidates: (projectId, candidates, canonicalPlaces) => {
        set((state) => ({
          restaurantPlaceCandidates: {
            ...state.restaurantPlaceCandidates,
            [projectId]: candidates,
          },
          restaurantCanonicalPlaces: {
            ...state.restaurantCanonicalPlaces,
            [projectId]: canonicalPlaces ?? [],
          },
        }))
      },
      getPlaceCandidates: (projectId) => {
        return get().restaurantPlaceCandidates[projectId] || (EMPTY_ARRAY as PlaceCandidate[])
      },
      getCanonicalPlaces: (projectId) => {
        return get().restaurantCanonicalPlaces[projectId] || (EMPTY_ARRAY as CanonicalPlace[])
      },
      selectPlace: (projectId, place, canonicalPlace) => {
        set((state) => ({
          restaurantSelectedPlace: {
            ...state.restaurantSelectedPlace,
            [projectId]: place,
          },
          restaurantSelectedCanonicalPlace: {
            ...state.restaurantSelectedCanonicalPlace,
            [projectId]: canonicalPlace,
          },
        }))
      },
      getSelectedPlace: (projectId) => {
        return get().restaurantSelectedPlace[projectId]
      },
      getSelectedCanonicalPlace: (projectId) => {
        return get().restaurantSelectedCanonicalPlace[projectId]
      },
      addReviewInput: (projectId, review) => {
        const newReview: UserReviewInput = {
          ...review,
          id: createId('review'),
          createdAt: nowIso(),
        }
        set((state) => ({
          restaurantReviewInputs: {
            ...state.restaurantReviewInputs,
            [projectId]: [...(state.restaurantReviewInputs[projectId] ?? []), newReview],
          },
        }))
      },
      getReviewInputs: (projectId) => {
        return get().restaurantReviewInputs[projectId] || (EMPTY_ARRAY as UserReviewInput[])
      },
      removeReviewInput: (projectId, reviewId) => {
        set((state) => ({
          restaurantReviewInputs: {
            ...state.restaurantReviewInputs,
            [projectId]: (state.restaurantReviewInputs[projectId] ?? []).filter(
              (r) => r.id !== reviewId
            ),
          },
        }))
      },
      setReviewDigest: (projectId, digest) => {
        set((state) => ({
          restaurantReviewDigest: {
            ...state.restaurantReviewDigest,
            [projectId]: digest,
          },
        }))
      },
      getReviewDigest: (projectId) => {
        return get().restaurantReviewDigest[projectId]
      },

      // ───────────────────────────────────────────────
      // Web Evidence 구현 (NEW)
      // ───────────────────────────────────────────────
      addWebEvidence: (projectId, evidence) => {
        set((state) => {
          const existing = state.restaurantWebEvidence[projectId] ?? []
          // 같은 장소(query)에 대한 evidence는 교체 (dedupe)
          const filtered = existing.filter(
            (e) => !(e.placeName === evidence.placeName && e.query === evidence.query)
          )
          return {
            restaurantWebEvidence: {
              ...state.restaurantWebEvidence,
              [projectId]: [...filtered, evidence],
            },
          }
        })
      },
      setWebEvidence: (projectId, evidence) => {
        set((state) => ({
          restaurantWebEvidence: {
            ...state.restaurantWebEvidence,
            [projectId]: evidence,
          },
        }))
      },
      getWebEvidence: (projectId) => {
        return get().restaurantWebEvidence[projectId] || (EMPTY_ARRAY as WebEvidence[])
      },
      removeWebEvidence: (projectId, evidenceId) => {
        set((state) => ({
          restaurantWebEvidence: {
            ...state.restaurantWebEvidence,
            [projectId]: (state.restaurantWebEvidence[projectId] ?? []).filter(
              (e) => e.id !== evidenceId
            ),
          },
        }))
      },
      clearWebEvidence: (projectId) => {
        set((state) => ({
          restaurantWebEvidence: {
            ...state.restaurantWebEvidence,
            [projectId]: [],
          },
        }))
      },

      // ───────────────────────────────────────────────
      // Draft Version Management 구현 (NEW)
      // ───────────────────────────────────────────────
      addDraftVersion: (projectId, version) => {
        const newVersion: RestaurantDraftVersion = {
          ...version,
          id: createId('version'),
        }
        set((state) => ({
          restaurantDraftVersions: {
            ...state.restaurantDraftVersions,
            [projectId]: [...(state.restaurantDraftVersions[projectId] ?? []), newVersion],
          },
          // 새 버전을 현재 버전으로 자동 설정
          restaurantCurrentDraftVersionId: {
            ...state.restaurantCurrentDraftVersionId,
            [projectId]: newVersion.id,
          },
        }))
        return newVersion
      },

      getDraftVersions: (projectId) => {
        return get().restaurantDraftVersions[projectId] || (EMPTY_ARRAY as RestaurantDraftVersion[])
      },

      getDraftVersionById: (projectId, versionId) => {
        const versions = get().restaurantDraftVersions[projectId] ?? []
        return versions.find((v) => v.id === versionId)
      },

      setCurrentDraftVersionId: (projectId, versionId) => {
        set((state) => ({
          restaurantCurrentDraftVersionId: {
            ...state.restaurantCurrentDraftVersionId,
            [projectId]: versionId,
          },
        }))
      },

      getCurrentDraftVersionId: (projectId) => {
        return get().restaurantCurrentDraftVersionId[projectId]
      },

      getCurrentDraftVersion: (projectId) => {
        const versionId = get().restaurantCurrentDraftVersionId[projectId]
        if (!versionId) return undefined
        const versions = get().restaurantDraftVersions[projectId] ?? []
        return versions.find((v) => v.id === versionId)
      },

      updateDraftVersionLabel: (projectId, versionId, label) => {
        set((state) => ({
          restaurantDraftVersions: {
            ...state.restaurantDraftVersions,
            [projectId]: (state.restaurantDraftVersions[projectId] ?? []).map((v) =>
              v.id === versionId ? { ...v, label } : v
            ),
          },
        }))
      },

      removeDraftVersion: (projectId, versionId) => {
        set((state) => {
          const versions = state.restaurantDraftVersions[projectId] ?? []
          const filtered = versions.filter((v) => v.id !== versionId)
          
          // 삭제한 버전이 현재 선택된 버전이면, 남은 버전 중 마지막으로 선택
          const currentId = state.restaurantCurrentDraftVersionId[projectId]
          const newCurrentId = currentId === versionId 
            ? (filtered.length > 0 ? filtered[filtered.length - 1].id : undefined)
            : currentId
          
          return {
            restaurantDraftVersions: {
              ...state.restaurantDraftVersions,
              [projectId]: filtered,
            },
            restaurantCurrentDraftVersionId: {
              ...state.restaurantCurrentDraftVersionId,
              [projectId]: newCurrentId,
            },
          }
        })
      },

      // ───────────────────────────────────────────────
      // Draft Regenerate & Variation Actions (신규)
      // ───────────────────────────────────────────────
      switchDraftVersion: (projectId, versionId) => {
        const version = get().getDraftVersionById(projectId, versionId)
        if (!version) {
          console.warn('[switchDraftVersion] Version not found:', versionId)
          return
        }
        
        // 현재 버전 ID 업데이트
        set((state) => ({
          restaurantCurrentDraftVersionId: {
            ...state.restaurantCurrentDraftVersionId,
            [projectId]: versionId,
          },
          // Draft도 해당 버전 내용으로 업데이트
          drafts: {
            ...state.drafts,
            [projectId]: {
              projectId,
              title: version.title,
              content: version.content,
              version: state.drafts[projectId]?.version ?? 1,
              wordCount: version.wordCount,
              updatedAt: nowIso(),
            },
          },
        }))
      },

      regenerateRestaurantDraft: async (projectId, settings) => {
        const state = get()
        
        // 현재 Digest가 없으면 재생성 불가
        const digest = state.restaurantReviewDigest[projectId]
        if (!digest) {
          console.warn('[regenerateRestaurantDraft] No review digest found')
          return null
        }

        const place = state.restaurantSelectedPlace[projectId]
        
        // Project 정보 조회
        const project = state.projects.find((p) => p.id === projectId)
        if (!project) {
          console.warn('[regenerateRestaurantDraft] Project not found')
          return null
        }
        
        try {
          // Dynamically import to avoid SSR issues
          const { generateRestaurantDraft } = await import('@/lib/ai/restaurant-draft')
          
          const input = {
            placeProfile: place!,
            reviewDigest: digest,
            settings,
            projectTitle: project.title,
            projectTopic: project.topic,
          }

          const result = await generateRestaurantDraft({
            ...input,
            mode: 'regenerate',
          })

          if (!result || (!result.title && !result.content)) {
            console.warn('[regenerateRestaurantDraft] Empty result from AI')
            return null
          }

          // 현재 Draft를 Version으로 저장
          const currentDraft = state.drafts[projectId]
          if (currentDraft) {
            const parentVersion: Omit<RestaurantDraftVersion, 'id'> = {
              projectId,
              mode: 'initial',
              channel: settings.channel,
              tone: settings.tone ?? 'friendly',
              title: currentDraft.title,
              content: currentDraft.content,
              summary: '',
              hashtags: [],
              generatedAt: nowIso(),
              wordCount: currentDraft.wordCount ?? currentDraft.content?.split(/\s+/).length ?? 0,
              usedFallback: (result as { usedFallback?: boolean }).usedFallback ?? false,
              source: (result as { usedFallback?: boolean }).usedFallback ? 'deterministic' : 'ai',
              label: '이전 버전',
              focusPoints: settings.focusPoints ?? [],
            }
            get().addDraftVersion(projectId, parentVersion)
          }

          // 새 결과를 Version으로 추가
          const newVersionData: Omit<RestaurantDraftVersion, 'id'> = {
            projectId,
            mode: 'regenerate',
            channel: settings.channel,
            tone: settings.tone ?? 'friendly',
            title: result.title,
            content: result.content,
            summary: result.summary ?? '',
            hashtags: result.hashtags ?? [],
            generatedAt: nowIso(),
            wordCount: result.metadata?.wordCount ?? result.content?.split(/\s+/).length ?? 0,
            source: result.usedFallback ? 'deterministic' : 'ai',
            usedFallback: result.usedFallback ?? false,
            label: '재생성',
            focusPoints: settings.focusPoints ?? [],
          }
          
          const newVersion = get().addDraftVersion(projectId, newVersionData)
          
          // Draft 업데이트
          const wordCount = result.metadata?.wordCount ?? result.content?.split(/\s+/).length ?? 0
          set((state) => ({
            drafts: {
              ...state.drafts,
              [projectId]: {
                projectId,
                title: result.title,
                content: result.content,
                version: (state.drafts[projectId]?.version ?? 0) + 1,
                wordCount,
                updatedAt: nowIso(),
              },
            },
          }))

          return newVersion
        } catch (error) {
          console.error('[regenerateRestaurantDraft] Error:', error)
          return null
        }
      },

      createRestaurantDraftVariation: async (projectId, settings, preset) => {
        const state = get()
        
        // 현재 Digest가 없으면 변형 불가
        const digest = state.restaurantReviewDigest[projectId]
        if (!digest) {
          console.warn('[createRestaurantDraftVariation] No review digest found')
          return null
        }

        const place = state.restaurantSelectedPlace[projectId]
        
        // Project 정보 조회
        const project = state.projects.find((p) => p.id === projectId)
        if (!project) {
          console.warn('[createRestaurantDraftVariation] Project not found')
          return null
        }
        
        try {
          // Dynamically import to avoid SSR issues
          const { generateRestaurantDraft } = await import('@/lib/ai/restaurant-draft')
          
          const input = {
            placeProfile: place!,
            reviewDigest: digest,
            settings,
            projectTitle: project.title,
            projectTopic: project.topic,
          }

          const result = await generateRestaurantDraft({
            ...input,
            mode: 'variation',
            preset,
          })

          if (!result || (!result.title && !result.content)) {
            console.warn('[createRestaurantDraftVariation] Empty result from AI')
            return null
          }

          // 현재 Draft를 Version으로 저장
          const currentDraft = state.drafts[projectId]
          if (currentDraft) {
            const parentVersion: Omit<RestaurantDraftVersion, 'id'> = {
              projectId,
              mode: 'initial',
              channel: settings.channel,
              tone: settings.tone ?? 'friendly',
              title: currentDraft.title,
              content: currentDraft.content,
              summary: '',
              hashtags: [],
              generatedAt: nowIso(),
              wordCount: currentDraft.wordCount ?? currentDraft.content?.split(/\s+/).length ?? 0,
              usedFallback: false,
              source: 'ai',
              label: '이전 버전',
              focusPoints: settings.focusPoints ?? [],
            }
            get().addDraftVersion(projectId, parentVersion)
          }

          // 프리셋별 라벨
          const presetLabels: Record<RestaurantDraftVariationPreset, string> = {
            same_but_fresher: '새로운 표현',
            shorter: '짧은 버전',
            more_informative: '정보 중심',
            more_friendly: '친근한 톤',
            menu_focus: '메뉴 중심',
            atmosphere_focus: '분위기 중심',
            location_price_focus: '위치/가격 중심',
            daangn_local: '당근마켓 스타일',
            threads_punchy: '스레드 스타일',
          }

          // 새 결과를 Version으로 추가
          const newVersionData: Omit<RestaurantDraftVersion, 'id'> = {
            projectId,
            mode: 'variation',
            preset,
            channel: settings.channel,
            tone: settings.tone ?? 'friendly',
            title: result.title,
            content: result.content,
            summary: result.summary ?? '',
            hashtags: result.hashtags ?? [],
            generatedAt: nowIso(),
            wordCount: result.metadata?.wordCount ?? result.content?.split(/\s+/).length ?? 0,
            source: result.usedFallback ? 'deterministic' : 'ai',
            usedFallback: result.usedFallback ?? false,
            label: presetLabels[preset] ?? '변형',
            focusPoints: settings.focusPoints ?? [],
          }
          
          const newVersion = get().addDraftVersion(projectId, newVersionData)
          
          // Draft 업데이트
          const variationWordCount = result.metadata?.wordCount ?? result.content?.split(/\s+/).length ?? 0
          set((state) => ({
            drafts: {
              ...state.drafts,
              [projectId]: {
                projectId,
                title: result.title,
                content: result.content,
                version: (state.drafts[projectId]?.version ?? 0) + 1,
                wordCount: variationWordCount,
                updatedAt: nowIso(),
              },
            },
          }))

          return newVersion
        } catch (error) {
          console.error('[createRestaurantDraftVariation] Error:', error)
          return null
        }
      },

      // ───────────────────────────────────────────────
      // Informational Domain Actions 구현 (신규)
      // ───────────────────────────────────────────────
      
      // Informational Draft 생성 (로딩 상태 및 에러 처리 개선)
      createInformationalDraft: async (projectId) => {
        const existing = get().drafts[projectId]
        if (existing) return existing

        const project = get().getProject(projectId)
        const settings = get().getDraftSettings(projectId)
        const infoSettings = get().getInformationalDraftSettings(projectId)
        const outline = get().informationalOutline[projectId]
        const sources = get().informationalSourceDocs[projectId]
        const meta = project?.informationalMeta

        if (!project || !settings) return undefined
        if (project.type !== 'informational') return undefined
        
        // 로딩 상태 시작
        set((state) => ({
          informationalDraftStatus: {
            ...state.informationalDraftStatus,
            [projectId]: {
              isGenerating: true,
              error: null,
              progress: 0,
            },
          },
        }))
        
        // InformationalDraftSettings가 없으면 기본값 사용
        const draftSettings: InformationalDraftSettings = infoSettings ?? {
          channel: 'blog',
          style: 'guide',
          includeFaq: true,
          includeChecklist: false,
          keywordHighlight: 'bold',
          promptMode: 'auto',
        }

        // outline이나 source가 없어도 fallback으로 진행
        if (!outline || !sources || sources.length === 0 || !meta) {
          console.warn('[createInformationalDraft] Missing research data, using fallback')
          
          // 진행률 업데이트
          set((state) => ({
            informationalDraftStatus: {
              ...state.informationalDraftStatus,
              [projectId]: {
                isGenerating: true,
                error: null,
                progress: 30,
              },
            },
          }))
          
          const fallbackContent = `# ${project.title}

${project.topic}에 대해 작성하는 글입니다.

아직 리서치 단계에서 충분한 데이터가 수집되지 않았습니다.
리서치 탭으로 돌아가서 소스 입력, 핵심 포인트 정리, 아웃라인 생성을 완료해주세요.

----

**프로젝트 정보**
- 주제: ${project.topic}
- 타겟: ${project.targetAudience}
- 톤: ${project.tone}

**다음 단계:**
1. 소스 문서 추가하기
2. 핵심 포인트 정리하기
3. 아웃라인 생성하기
4. 초안 생성하기`

          const fallbackDraft: Draft = {
            projectId,
            title: project.title,
            content: fallbackContent,
            version: 1,
            wordCount: fallbackContent.length,
            updatedAt: nowIso(),
          }

          set((state) => ({
            drafts: {
              ...state.drafts,
              [projectId]: fallbackDraft,
            },
            informationalDraftStatus: {
              ...state.informationalDraftStatus,
              [projectId]: {
                isGenerating: false,
                error: null,
                progress: 100,
              },
            },
          }))

          return fallbackDraft
        }

        // AI 생성 시도
        try {
          // 진행률 업데이트
          set((state) => ({
            informationalDraftStatus: {
              ...state.informationalDraftStatus,
              [projectId]: {
                isGenerating: true,
                error: null,
                progress: 20,
              },
            },
          }))
          
          const { generateInformationalDraft } = await import('@/lib/ai/informational-draft')

          // 진행률 업데이트
          set((state) => ({
            informationalDraftStatus: {
              ...state.informationalDraftStatus,
              [projectId]: {
                isGenerating: true,
                error: null,
                progress: 50,
              },
            },
          }))

          const stageLabels: Record<string, string> = {
            'source-collection': '자료 수집 중',
            'research-distillation': '핵심 내용 정리 중',
            'outline-generation': '글 구조 설계 중',
            'title-generation': '제목 생성 중',
            'body-generation': '본문 작성 중',
            'natural-rewrite': '문장 다듬는 중',
            'quality-review': '품질 검사 중',
            'draft-commit': '완료',
          }

          const result = await generateInformationalDraft({
            meta,
            outline,
            sources,
            settings: draftSettings,
            projectTitle: project.title,
            projectTopic: project.topic,
            customPrompt: draftSettings.customPrompt,
            promptMode: draftSettings.promptMode,
            presetId: draftSettings.presetId,
          }, (status) => {
            // Progress 콜백
            set((state) => ({
              informationalDraftStatus: {
                ...state.informationalDraftStatus,
                [projectId]: {
                  isGenerating: status.progress < 100,
                  error: null,
                  progress: status.progress,
                  currentStage: status.stage,
                  stageLabel: stageLabels[status.stage] || status.message,
                  stageIndex: ['source-collection', 'research-distillation', 'outline-generation', 'title-generation', 'body-generation', 'natural-rewrite', 'quality-review', 'draft-commit'].indexOf(status.stage),
                },
              },
            }))
          })

          const draft: Draft = {
            projectId,
            title: result.title,
            content: result.content,
            version: 1,
            wordCount: result.metadata?.wordCount ?? result.content.length,
            updatedAt: nowIso(),
            usedSourceIds: result.usedSourceIds,
          }

          set((state) => ({
            drafts: {
              ...state.drafts,
              [projectId]: draft,
            },
            informationalDraftStatus: {
              ...state.informationalDraftStatus,
              [projectId]: {
                isGenerating: false,
                error: null,
                progress: 100,
              },
            },
          }))

          return draft
        } catch (error) {
          console.error('[createInformationalDraft] Failed:', error)
          
          // 에러 상태 업데이트
          set((state) => ({
            informationalDraftStatus: {
              ...state.informationalDraftStatus,
              [projectId]: {
                isGenerating: false,
                error: error instanceof Error ? error.message : '초안 생성 중 오류가 발생했습니다.',
                progress: 0,
                currentStage: 'error',
                stageLabel: '오류 발생',
                stageIndex: -1,
              },
            },
          }))
          
          return undefined
        }
      },

      saveInformationalDraftSettings: (projectId, settings) => {
        set((state) => ({
          informationalDraftSettings: {
            ...state.informationalDraftSettings,
            [projectId]: settings,
          },
        }))
      },
      getInformationalDraftSettings: (projectId) => {
        return get().informationalDraftSettings[projectId]
      },

      addSource: (projectId, source) => {
        const newSource: SourceInput = {
          ...source,
          id: createId('source'),
          addedAt: nowIso(),
        }
        set((state) => ({
          informationalSources: {
            ...state.informationalSources,
            [projectId]: [...(state.informationalSources[projectId] ?? []), newSource],
          },
        }))
      },
      getSources: (projectId) => {
        return get().informationalSources[projectId] || (EMPTY_ARRAY as SourceInput[])
      },
      removeSource: (projectId, sourceId) => {
        set((state) => ({
          informationalSources: {
            ...state.informationalSources,
            [projectId]: (state.informationalSources[projectId] ?? []).filter(
              (s) => s.id !== sourceId
            ),
          },
        }))
      },
      setSourceDocument: (projectId, doc) => {
        set((state) => ({
          informationalSourceDocs: {
            ...state.informationalSourceDocs,
            [projectId]: [...(state.informationalSourceDocs[projectId] ?? []), doc],
          },
        }))
      },
      getSourceDocuments: (projectId) => {
        return get().informationalSourceDocs[projectId] || (EMPTY_ARRAY as SourceDocument[])
      },
      setOutline: (projectId, outline) => {
        set((state) => ({
          informationalOutline: {
            ...state.informationalOutline,
            [projectId]: outline,
          },
        }))
      },
      getOutline: (projectId) => {
        return get().informationalOutline[projectId]
      },
      setTopicAnalysis: (projectId, analysis) => {
        set((state) => ({
          informationalTopicAnalysis: {
            ...state.informationalTopicAnalysis,
            [projectId]: analysis,
          },
        }))
      },
      getTopicAnalysis: (projectId) => {
        return get().informationalTopicAnalysis[projectId]
      },
      setKeyPoints: (projectId, keyPoints) => {
        set((state) => ({
          informationalKeyPoints: {
            ...state.informationalKeyPoints,
            [projectId]: keyPoints,
          },
        }))
      },
      getKeyPoints: (projectId) => {
        return get().informationalKeyPoints[projectId] || (EMPTY_ARRAY as KeyPoint[])
      },

      resetAll: () =>
        set({
          projects: [],
          researchItems: {},
          selectedResearchIds: {},
          draftSettings: {},
          drafts: {},
          imagePrompts: {},
          thumbnailSettings: {},
          // Domain states reset (신규)
          restaurantPlaceCandidates: {},
          restaurantCanonicalPlaces: {},
          restaurantSelectedPlace: {},
          restaurantSelectedCanonicalPlace: {},
          restaurantReviewInputs: {},
          restaurantReviewDigest: {},
          restaurantWebEvidence: {},
          restaurantDraftVersions: {},
          restaurantCurrentDraftVersionId: {},
          informationalSources: {},
          informationalSourceDocs: {},
          informationalOutline: {},
          informationalTopicAnalysis: {},
          informationalKeyPoints: {},
          informationalDraftSettings: {},
        }),
    }),
    {
      name: 'blog-mvp-project-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        researchItems: state.researchItems,
        selectedResearchIds: state.selectedResearchIds,
        draftSettings: state.draftSettings,
        drafts: state.drafts,
        imagePrompts: state.imagePrompts,
        thumbnailSettings: state.thumbnailSettings,
        // Domain states persist (신규)
        restaurantPlaceCandidates: state.restaurantPlaceCandidates,
        restaurantCanonicalPlaces: state.restaurantCanonicalPlaces,
        restaurantSelectedPlace: state.restaurantSelectedPlace,
        restaurantSelectedCanonicalPlace: state.restaurantSelectedCanonicalPlace,
        restaurantReviewInputs: state.restaurantReviewInputs,
        restaurantReviewDigest: state.restaurantReviewDigest,
        restaurantWebEvidence: state.restaurantWebEvidence,
        restaurantDraftVersions: state.restaurantDraftVersions,
        restaurantCurrentDraftVersionId: state.restaurantCurrentDraftVersionId,
        informationalSources: state.informationalSources,
        informationalSourceDocs: state.informationalSourceDocs,
        informationalOutline: state.informationalOutline,
        informationalDraftSettings: state.informationalDraftSettings,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (!error) {
            state?.setHasHydrated(true)
          }
        }
      },
    },
  ),
)

// ============================================
// 안정적인 Selector Helpers
// ============================================

/**
 * 안전한 배열 반환을 위한 헬퍼
 * React #185 오류 방지를 위해 참조 안정성 확보
 */
export function safeArray<T>(arr: T[] | undefined): T[] {
  return arr || (EMPTY_ARRAY as T[])
}
