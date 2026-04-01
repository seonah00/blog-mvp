/**
 * Threads Settings QA Runner
 */

import { runThreadsSettingsQA } from './threads-settings-qa'

const results = runThreadsSettingsQA()

console.log('\n=== Threads Settings QA Report ===\n')

let passed = 0
let failed = 0

results.forEach(result => {
  const icon = result.passed ? '✅' : '❌'
  console.log(`${icon} [${result.category}] ${result.message}`)
  if (result.details && result.details.length > 0) {
    result.details.forEach(detail => console.log(`   - ${detail}`))
  }
  
  if (result.passed) passed++
  else failed++
})

console.log(`\n총 ${results.length}개 항목: ${passed}개 Pass, ${failed}개 Fail`)
process.exit(failed > 0 ? 1 : 0)
