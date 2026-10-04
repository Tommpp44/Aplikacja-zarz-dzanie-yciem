import {
  buildDailyBrief,
  buildFinanceSummary,
  type BriefFacts,
  type FinanceSummaryFacts,
} from './brief'
import { parseTransactionText, type ParsedTransaction } from './parse-transaction'
import { parseQuickAdd, type QuickAddResult } from '@/lib/tasks/quick-add'
import type { Locale } from '@/lib/i18n/config'

/**
 * AI abstraction. LifeOS never depends on a single model vendor: features call
 * this interface, and the default implementation is deterministic and offline.
 * An LLM-backed provider can implement the same interface later.
 *
 * Safety rules (enforced by callers, see ARCHITECTURE.md):
 *  - providers only analyse, summarise, classify and draft;
 *  - they never write data, move money or delete anything themselves;
 *  - every draft is shown to the user and saved only after explicit confirmation.
 */
export interface AIProvider {
  readonly name: string
  dailyBrief(facts: BriefFacts, locale?: Locale): Promise<string[]>
  financeSummary(facts: FinanceSummaryFacts, locale?: Locale): Promise<string | null>
  parseTransaction(text: string, today: string): Promise<ParsedTransaction>
  parseTask(text: string, today: string): Promise<QuickAddResult>
}

export class RuleBasedProvider implements AIProvider {
  readonly name = 'rules'
  async dailyBrief(facts: BriefFacts, locale?: Locale) {
    return buildDailyBrief(facts, locale)
  }
  async financeSummary(facts: FinanceSummaryFacts, locale?: Locale) {
    return buildFinanceSummary(facts, locale)
  }
  async parseTransaction(text: string, today: string) {
    return parseTransactionText(text, today)
  }
  async parseTask(text: string, today: string) {
    return parseQuickAdd(text, today)
  }
}

let provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  // AI_PROVIDER selects the implementation; only 'rules' ships in the MVP.
  provider ??= new RuleBasedProvider()
  return provider
}
