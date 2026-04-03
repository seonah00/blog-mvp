/**
 * Pipeline Module - 8단계 블로그 초안 생성 파이프라인
 * 
 * 단계:
 * 1. Source Collection
 * 2. Research Distillation
 * 3. Outline Generation
 * 4. Title Generation
 * 5. Body Generation
 * 6. Natural Rewrite
 * 7. Quality Review
 * 8. Draft Commit
 */

// Types
export type {
  PipelineStage,
  PipelineStatus,
  PipelineLog,
  PipelineResult,
  PipelineConfig,
  PipelineSource,
  DistilledFacts,
  StructuredOutline,
  TitleGenerationResult,
  RawDraft,
  RewrittenDraft,
  QualityReviewResult,
  FinalDraft,
  InformationalPipelineInput,
  RestaurantPipelineInput,
} from './types'

// Orchestrator
export {
  runInformationalPipeline,
  runRestaurantPipeline,
  STAGE_ORDER,
  STAGE_NAMES,
  STAGE_WEIGHTS,
  DEFAULT_CONFIG,
} from './orchestrator'

// Individual stages (for advanced usage/testing)
export { collectSources, collectRestaurantSources } from './stage-1-source'
export { distillResearch, distillRestaurantResearch } from './stage-2-distiller'
export { generateOutline, generateRestaurantOutline } from './stage-3-outline'
export { generateTitle } from './stage-4-title'
export { generateBody, generateRestaurantBody } from './stage-5-body'
export { rewriteNatural, rewriteRestaurantNatural } from './stage-6-rewrite'
export { reviewQuality, formatQualityReport, meetsQualityStandards } from './stage-7-quality'

// Errors
export { PipelineError, QualityCheckError } from './types'
