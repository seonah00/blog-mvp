/**
 * Pipeline Orchestrator - 8단계 블로그 초안 생성 파이프라인 조율
 * 
 * 단계:
 * 1. Source Collection - 외부 검색/리서치/플레이스/리뷰 수집
 * 2. Research Distillation - raw source에서 핵심 사실/주장/사례 추출
 * 3. Outline Generation - 최종 글 구조 설계
 * 4. Title Generation - 본문과 별도로 제목 생성 (메인 키워드 필수)
 * 5. Body Generation - outline + distilled data로 초안 생성
 * 6. Natural Rewrite - 문장 자연화 (메모투 제거, 사람말투 변환)
 * 7. Quality Review - banned terms, placeholder, 중복 등 검사
 * 8. Draft Commit - 검수 완료된 결과만 editor에 반영
 */

import { nowIso } from '@/lib/utils'
import type {
  PipelineStage,
  PipelineStatus,
  PipelineLog,
  PipelineResult,
  PipelineConfig,
  PipelineError,
  InformationalPipelineInput,
  RestaurantPipelineInput,
  FinalDraft,
} from './types'

// Import for type casting
import type { InformationalPipelineInput as InfoInput } from './types'

// Stage implementations (lazy load to avoid circular deps)
const stageModules = {
  'source-collection': () => import('./stage-1-source'),
  'research-distillation': () => import('./stage-2-distiller'),
  'outline-generation': () => import('./stage-3-outline'),
  'title-generation': () => import('./stage-4-title'),
  'body-generation': () => import('./stage-5-body'),
  'natural-rewrite': () => import('./stage-6-rewrite'),
  'quality-review': () => import('./stage-7-quality'),
} as const

// Default configuration
const DEFAULT_CONFIG: PipelineConfig = {
  stages: {
    'source-collection': { enabled: true, retryCount: 1, timeoutMs: 30000 },
    'research-distillation': { enabled: true, retryCount: 2, timeoutMs: 60000 },
    'outline-generation': { enabled: true, retryCount: 2, timeoutMs: 60000 },
    'title-generation': { enabled: true, retryCount: 2, timeoutMs: 30000 },
    'body-generation': { enabled: true, retryCount: 2, timeoutMs: 120000 },
    'natural-rewrite': { enabled: true, retryCount: 2, timeoutMs: 60000 },
    'quality-review': { enabled: true, retryCount: 1, timeoutMs: 30000 },
    'draft-commit': { enabled: true, retryCount: 1, timeoutMs: 10000 },
  },
  quality: {
    minPassScore: 80,
    autoFix: true,
    maxRetries: 2,
  },
  logging: {
    level: 'info',
    includeRawOutput: false,
  },
}

// Pipeline stage order
const STAGE_ORDER: PipelineStage[] = [
  'source-collection',
  'research-distillation',
  'outline-generation',
  'title-generation',
  'body-generation',
  'natural-rewrite',
  'quality-review',
  'draft-commit',
]

// Stage display names (Korean)
const STAGE_NAMES: Record<PipelineStage, string> = {
  'source-collection': '자료 수집 중',
  'research-distillation': '핵심 내용 정리 중',
  'outline-generation': '글 구조 설계 중',
  'title-generation': '제목 생성 중',
  'body-generation': '본문 작성 중',
  'natural-rewrite': '문장 다듬는 중',
  'quality-review': '품질 검사 중',
  'draft-commit': '초안 저장 중',
}

// Stage progress weights (for overall progress calculation)
const STAGE_WEIGHTS: Record<PipelineStage, number> = {
  'source-collection': 10,
  'research-distillation': 15,
  'outline-generation': 10,
  'title-generation': 10,
  'body-generation': 25,
  'natural-rewrite': 15,
  'quality-review': 10,
  'draft-commit': 5,
}

// ============================================
// Pipeline Context (passed between stages)
// ============================================

interface PipelineContext {
  projectId: string
  projectType: 'informational' | 'restaurant'
  input: InformationalPipelineInput | RestaurantPipelineInput
  config: PipelineConfig
  
  // Stage outputs
  sources?: Awaited<ReturnType<typeof import('./stage-1-source')['collectSources']>>
  distilled?: Awaited<ReturnType<typeof import('./stage-2-distiller')['distillResearch']>>
  outline?: Awaited<ReturnType<typeof import('./stage-3-outline')['generateOutline']>>
  titleResult?: Awaited<ReturnType<typeof import('./stage-4-title')['generateTitle']>>
  rawDraft?: Awaited<ReturnType<typeof import('./stage-5-body')['generateBody']>>
  rewritten?: Awaited<ReturnType<typeof import('./stage-6-rewrite')['rewriteNatural']>>
  qualityResult?: Awaited<ReturnType<typeof import('./stage-7-quality')['reviewQuality']>>
  
  // Metadata
  logs: PipelineLog[]
  startTime: string
  stageStartTime?: string
}

// ============================================
// Progress Callback
// ============================================

export type ProgressCallback = (status: PipelineStatus) => void | Promise<void>

// ============================================
// Main Pipeline Functions
// ============================================

/**
 * 정보성 글 파이프라인 실행
 */
export async function runInformationalPipeline(
  input: InformationalPipelineInput,
  onProgress?: ProgressCallback,
  config: Partial<PipelineConfig> = {}
): Promise<PipelineResult> {
  const mergedConfig = mergeConfig(config)
  const context: PipelineContext = {
    projectId: input.projectId,
    projectType: 'informational',
    input,
    config: mergedConfig,
    logs: [],
    startTime: nowIso(),
  }

  return runPipeline(context, onProgress)
}

/**
 * 맛집 글 파이프라인 실행
 */
export async function runRestaurantPipeline(
  input: RestaurantPipelineInput,
  onProgress?: ProgressCallback,
  config: Partial<PipelineConfig> = {}
): Promise<PipelineResult> {
  const mergedConfig = mergeConfig(config)
  const context: PipelineContext = {
    projectId: input.projectId,
    projectType: 'restaurant',
    input,
    config: mergedConfig,
    logs: [],
    startTime: nowIso(),
  }

  return runPipeline(context, onProgress)
}

/**
 * 파이프라인 실행 (공통)
 */
async function runPipeline(
  context: PipelineContext,
  onProgress?: ProgressCallback
): Promise<PipelineResult> {
  const { config, projectType } = context

  for (const stage of STAGE_ORDER) {
    // Skip disabled stages
    if (!config.stages[stage].enabled) {
      log(context, stage, '단계 스킵 (비활성화)', 'info')
      continue
    }

    // Update status
    context.stageStartTime = nowIso()
    const status = buildStatus(context, stage, 0)
    await onProgress?.(status)

    try {
      log(context, stage, `${STAGE_NAMES[stage]} 시작`, 'info')
      
      // Execute stage with timeout
      const timeout = config.stages[stage].timeoutMs
      await executeStageWithTimeout(context, stage, timeout)
      
      // Update progress to 100% for this stage
      const completedStatus = buildStatus(context, stage, 100)
      await onProgress?.(completedStatus)
      
      log(context, stage, `${STAGE_NAMES[stage]} 완료`, 'info')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      log(context, stage, `${STAGE_NAMES[stage]} 실패: ${errorMessage}`, 'error', error)
      
      // Check if recoverable
      const isRecoverable = error instanceof Error && 
        (error as PipelineError).recoverable === true
      
      if (isRecoverable && config.stages[stage].retryCount > 0) {
        // Retry logic
        const retryCount = config.stages[stage].retryCount
        const timeoutMs = config.stages[stage].timeoutMs
        for (let i = 0; i < retryCount; i++) {
          try {
            log(context, stage, `재시도 ${i + 1}/${retryCount}`, 'warn')
            await executeStageWithTimeout(context, stage, timeoutMs)
            break // Success on retry
          } catch (retryError) {
            if (i === retryCount - 1) {
              return buildErrorResult(context, stage, retryError)
            }
          }
        }
      } else {
        return buildErrorResult(context, stage, error)
      }
    }
  }

  // Build success result
  return buildSuccessResult(context)
}

/**
 * 단계 실행 (타임아웃 적용)
 */
async function executeStageWithTimeout(
  context: PipelineContext,
  stage: PipelineStage,
  timeoutMs: number
): Promise<void> {
  const execute = async () => {
    const isRestaurant = context.projectType === 'restaurant'
    
    switch (stage) {
      case 'source-collection': {
        const mod = await stageModules[stage]()
        if (isRestaurant) {
          const restaurantMod = await import('./stage-1-source')
          context.sources = await restaurantMod.collectRestaurantSources(context.input as RestaurantPipelineInput)
        } else {
          context.sources = await mod.collectSources(context.input as InformationalPipelineInput)
        }
        break
      }
      
      case 'research-distillation': {
        if (!context.sources) throw new Error('Sources not available')
        if (isRestaurant) {
          const restaurantMod = await import('./stage-2-distiller')
          context.distilled = await restaurantMod.distillRestaurantResearch(
            context.sources,
            context.input as RestaurantPipelineInput
          )
        } else {
          const mod = await stageModules[stage]()
          context.distilled = await mod.distillResearch(
            context.sources,
            context.input as InformationalPipelineInput,
            (progress) => updateStageProgress(context, stage, progress)
          )
        }
        break
      }
      
      case 'outline-generation': {
        if (isRestaurant) {
          const restaurantMod = await import('./stage-3-outline')
          context.outline = await restaurantMod.generateRestaurantOutline(
            context.distilled,
            context.input as RestaurantPipelineInput
          )
        } else {
          const mod = await stageModules[stage]()
          context.outline = await mod.generateOutline(
            context.distilled,
            context.input as InformationalPipelineInput,
            (progress) => updateStageProgress(context, stage, progress)
          )
        }
        break
      }
      
      case 'title-generation': {
        if (!context.outline) throw new Error('Outline not available')
        const mod = await stageModules[stage]()
        context.titleResult = await mod.generateTitle(
          context.outline,
          context.input,
          context.projectType
        )
        break
      }
      
      case 'body-generation': {
        if (!context.outline || !context.titleResult) {
          throw new Error('Outline or title not available')
        }
        if (isRestaurant) {
          const restaurantMod = await import('./stage-5-body')
          context.rawDraft = await restaurantMod.generateRestaurantBody(
            context.outline,
            context.input as RestaurantPipelineInput,
            context.titleResult
          )
        } else {
          const mod = await stageModules[stage]()
          context.rawDraft = await mod.generateBody(
            context.outline,
            context.distilled,
            context.titleResult,
            context.input as InformationalPipelineInput,
            (progress) => updateStageProgress(context, stage, progress)
          )
        }
        break
      }
      
      case 'natural-rewrite': {
        if (!context.rawDraft) throw new Error('Raw draft not available')
        if (isRestaurant) {
          const restaurantMod = await import('./stage-6-rewrite')
          context.rewritten = await restaurantMod.rewriteRestaurantNatural(
            context.rawDraft,
            context.input as RestaurantPipelineInput
          )
        } else {
          const mod = await stageModules[stage]()
          context.rewritten = await mod.rewriteNatural(
            context.rawDraft,
            context.input as InformationalPipelineInput,
            (progress) => updateStageProgress(context, stage, progress)
          )
        }
        break
      }
      
      case 'quality-review': {
        if (!context.rewritten || !context.titleResult) {
          throw new Error('Rewritten draft or title not available')
        }
        const mod = await stageModules[stage]()
        context.qualityResult = await mod.reviewQuality(
          context.rewritten,
          context.titleResult,
          context.input,
          context.config.quality
        )
        
        // Check if quality passed
        if (context.qualityResult.finalStatus === 'fail') {
          const error = new Error('품질 검사 실패: ' + 
            context.qualityResult.reviewNotes.join(', '))
          ;(error as PipelineError).recoverable = true
          throw error
        }
        break
      }
      
      case 'draft-commit': {
        if (!context.qualityResult || !context.titleResult || !context.outline) {
          throw new Error('Required data not available for commit')
        }
        // Draft commit is handled by the caller (store)
        break
      }
    }
  }

  // Execute with timeout
  return Promise.race([
    execute(),
    new Promise<void>((_, reject) => 
      setTimeout(() => reject(new Error(`${stage} 타임아웃 (${timeoutMs}ms)`)), timeoutMs)
    ),
  ])
}

// ============================================
// Utility Functions
// ============================================

function mergeConfig(partial: Partial<PipelineConfig>): PipelineConfig {
  return {
    stages: { ...DEFAULT_CONFIG.stages, ...partial.stages },
    quality: { ...DEFAULT_CONFIG.quality, ...partial.quality },
    logging: { ...DEFAULT_CONFIG.logging, ...partial.logging },
  }
}

function log(
  context: PipelineContext,
  stage: PipelineStage,
  message: string,
  level: PipelineLog['level'] = 'info',
  details?: unknown
): void {
  const logEntry: PipelineLog = {
    stage,
    timestamp: nowIso(),
    message,
    level,
    details,
  }
  context.logs.push(logEntry)
  
  if (context.config.logging.level === 'debug' || level !== 'info') {
    console.log(`[Pipeline][${stage}] ${message}`)
  }
}

function buildStatus(
  context: PipelineContext,
  currentStage: PipelineStage,
  stageProgress: number
): PipelineStatus {
  // Calculate overall progress
  let overallProgress = 0
  for (const stage of STAGE_ORDER) {
    if (stage === currentStage) {
      overallProgress += STAGE_WEIGHTS[stage] * (stageProgress / 100)
      break
    } else {
      overallProgress += STAGE_WEIGHTS[stage]
    }
  }

  return {
    currentStage,
    stageProgress,
    overallProgress: Math.round(overallProgress),
    stageMessage: STAGE_NAMES[currentStage],
    startTime: context.startTime,
  }
}

function updateStageProgress(
  context: PipelineContext,
  stage: PipelineStage,
  progress: number
): void {
  // This would be called by individual stages
  // In a real implementation, this would trigger onProgress callback
}

function buildSuccessResult(context: PipelineContext): PipelineResult {
  if (!context.qualityResult || !context.titleResult || !context.outline || !context.rewritten) {
    throw new Error('Missing required data for success result')
  }

  const finalDraft: FinalDraft = {
    title: context.titleResult.selectedTitle,
    content: context.qualityResult.fixedContent,
    sections: context.rewritten.sections,
    outline: context.outline,
    titleResult: context.titleResult,
    qualityReport: context.qualityResult,
    keywordUsage: {}, // TODO: populate from context
    metadata: {
      wordCount: context.rewritten.sections.reduce((sum, s) => sum + s.wordCount, 0),
      estimatedReadTime: Math.ceil(context.rewritten.sections.length * 2),
      tone: 'natural',
      generatedAt: nowIso(),
      pipelineVersion: '1.0.0',
    },
  }

  return {
    success: true,
    stage: 'draft-commit',
    draft: finalDraft,
    logs: context.logs,
  }
}

function buildErrorResult(
  context: PipelineContext,
  stage: PipelineStage,
  error: unknown
): PipelineResult {
  const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
  
  return {
    success: false,
    stage,
    logs: context.logs,
    error: {
      stage,
      message: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    },
  }
}

// ============================================
// Export individual stage runners (for testing/debugging)
// ============================================

export {
  STAGE_ORDER,
  STAGE_NAMES,
  STAGE_WEIGHTS,
  DEFAULT_CONFIG,
}
