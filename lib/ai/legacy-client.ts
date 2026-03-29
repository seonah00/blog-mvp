/**
 * Legacy AI Client Interface
 * 
 * Backward compatibility를 위한 기존 client interface
 * 새로운 코드에서는 generateAiObject()를 사용하세요.
 */

import type {
  AIConfig,
  AIRequest,
  AIResponse,
  CorrectionInput,
  CorrectionOutput,
  ImagePromptInput,
  ImagePromptOutput,
  SNSTransformInput,
  SNSTransformOutput,
} from './types'
import { createMockCorrectionOutput } from './schemas/correction'
import { createMockImagePromptOutput } from './schemas/image'
import { createMockSNSTransformOutput } from './schemas/sns'

export interface AIClient {
  request<TInput, TOutput>(request: AIRequest<TInput>): Promise<AIResponse<TOutput>>
}

export const defaultAIConfig: AIConfig = {
  provider: 'mock',
  model: 'mock-gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  timeout: 30000,
  retryCount: 3,
}

export class MockAIClient implements AIClient {
  private config: AIConfig

  constructor(config: Partial<AIConfig> = {}) {
    this.config = { ...defaultAIConfig, ...config }
  }

  async request<TInput, TOutput>(
    request: AIRequest<TInput>
  ): Promise<AIResponse<TOutput>> {
    const startTime = Date.now()

    try {
      let output: unknown

      switch (request.feature) {
        case 'correction': {
          const input = request.input as CorrectionInput
          output = createMockCorrectionOutput(input)
          break
        }
        case 'image-prompt': {
          const input = request.input as ImagePromptInput
          output = createMockImagePromptOutput(input)
          break
        }
        case 'sns-transform': {
          const input = request.input as SNSTransformInput
          output = createMockSNSTransformOutput(input)
          break
        }
        default:
          return {
            success: false,
            error: {
              code: 'UNSUPPORTED_FEATURE',
              message: `Feature '${request.feature}' is not supported`,
              retryable: false,
            },
            metadata: {
              model: this.config.model,
              latencyMs: Date.now() - startTime,
              cached: false,
            },
          }
      }

      await this.simulateLatency()

      return {
        success: true,
        data: output as TOutput,
        metadata: {
          model: this.config.model,
          latencyMs: Date.now() - startTime,
          cached: false,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOCK_GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
        metadata: {
          model: this.config.model,
          latencyMs: Date.now() - startTime,
          cached: false,
        },
      }
    }
  }

  private async simulateLatency(): Promise<void> {
    const delay = 500 + Math.random() * 1000
    return new Promise(resolve => setTimeout(resolve, delay))
  }
}

export function createAIClient(config: Partial<AIConfig> = {}): AIClient {
  const mergedConfig = { ...defaultAIConfig, ...config }

  switch (mergedConfig.provider) {
    case 'mock':
      return new MockAIClient(mergedConfig)
    default:
      console.warn(`[AI Client] Unknown provider '${mergedConfig.provider}', falling back to mock`)
      return new MockAIClient(mergedConfig)
  }
}
