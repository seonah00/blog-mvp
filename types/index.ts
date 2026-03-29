/**
 * Types Barrel Export
 * 
 * 모든 타입을 중앙에서 re-export
 * 이 파일에서는 import 없이 export만 수행
 */

// ───────────────────────────────────────────────
// Common Types (Base)
// ───────────────────────────────────────────────
export type {
  ProjectType,
  ProjectTone,
  DraftLength,
  ProjectStatus,
  ResearchItem,
  DraftSettings,
  Draft,
  GeneratedImage,
  ImagePrompt,
  ThumbnailSettings,
  ParagraphDraft,
} from './common'

// ───────────────────────────────────────────────
// Restaurant Domain Types
// ───────────────────────────────────────────────
export type {
  RestaurantProjectMeta,
  PlaceCandidate,
  NormalizedPlaceProfile,
  ReviewSourceType,
  UserReviewInput,
  ReviewDigest,
  PlaceNormalizationInput,
  RestaurantDraftSettings,
  RestaurantAssistantMessage,
  RestaurantDraftHelperData,
  RestaurantResearchInput,
  RestaurantResearchOutput,
  RestaurantDraftInput,
  RestaurantDraftOutput,
  RestaurantDraftVersion,
  RestaurantDraftGenerationMode,
  RestaurantDraftVariationPreset,
} from './restaurant'

// ───────────────────────────────────────────────
// Informational Domain Types
// ───────────────────────────────────────────────
export type {
  InformationalProjectMeta,
  SourceType,
  SourceInput,
  SourceDocument,
  KeyPointCategory,
  KeyPoint,
  TopicAnalysis,
  OutlineSection,
  InformationalOutline,
  InformationalDraftSettings,
  InformationalAssistantMessage,
  InformationalDraftHelperData,
  InformationalResearchInput,
  InformationalResearchOutput,
  InformationalOutlineInput,
  InformationalDraftInput,
  InformationalDraftOutput,
} from './informational'

// ───────────────────────────────────────────────
// Project (Composite)
// ───────────────────────────────────────────────
import type { RestaurantProjectMeta } from './restaurant'
import type { InformationalProjectMeta } from './informational'
import type { ProjectType, ProjectTone, ProjectStatus } from './common'

/**
 * 프로젝트
 */
export interface Project {
  id: string
  /** 프로젝트 타입 */
  type: ProjectType
  title: string
  topic: string
  targetAudience: string
  tone: ProjectTone
  keywords: string[]
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  /** 타입별 메타데이터 */
  restaurantMeta?: RestaurantProjectMeta
  informationalMeta?: InformationalProjectMeta
}

/**
 * 프로젝트 생성 입력
 */
export interface CreateProjectInput {
  /** 프로젝트 타입 */
  type: ProjectType
  title: string
  topic: string
  targetAudience: string
  tone: ProjectTone
  keywords: string[]
  /** 타입별 메타데이터 */
  restaurantMeta?: RestaurantProjectMeta
  informationalMeta?: InformationalProjectMeta
}
