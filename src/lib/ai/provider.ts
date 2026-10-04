import {
  buildDailyBrief,
  buildFinanceSummary,
  type BriefFacts,
  type FinanceSummaryFacts,
} from './brief'
import { parseTransactionText, type ParsedTransaction } from './parse-transaction'
import { parseQuickAdd, type QuickAddResult } from '@/lib/tasks/quick-add'

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
  dailyBrief(facts: BriefFacts): Promise<string[]>
  financeSummary(facts: FinanceSummaryFacts): Promise<string | null>
  parseTransaction(text: string, today: string): Promise<ParsedTransaction>
  parseTask(text: string, today: string): Promise<QuickAddResult>
}

export class RuleBasedProvider implements AIProvider {
  readonly name = 'rules'
  async dailyBrief(facts: BriefFacts) {
    return buildDailyBrief(facts)
  }
  async financeSummary(facts: FinanceSummaryFacts) {
    return buildFinanceSummary(facts)
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
