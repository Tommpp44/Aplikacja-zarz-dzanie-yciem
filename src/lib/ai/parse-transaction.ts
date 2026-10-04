import { addDaysISO, type ISODate } from '@/lib/dates'

/**
 * Rule-based natural-language transaction parser:
 *   "Spent 54 PLN on groceries at Lidl"      -> expense 54 PLN, category Food, merchant Lidl
 *   "Got salary 10450 yesterday"               -> income 10450, category Salary
 *   "Uber 23,50"                               -> expense 23.50, category Transport, merchant Uber
 * It only produces a draft — the user always confirms before anything is saved.
 */
export type ParsedTransaction = {
  txn_type: 'expense' | 'income'
  amount: string | null
  currency: string | null
  categoryName: string | null
  merchant: string | null
  description: string | null
  occurred_on: ISODate
}

const CATEGORY_KEYWORDS: [string, 'expense' | 'income', RegExp][] = [
  [
    'Food',
    'expense',
    /\b(groceries|grocery|food|lunch|dinner|breakfast|restaurant|cafe|coffee|pizza|lidl|biedronka|aldi|carrefour|kaufland|zabka|żabka|auchan|tesco|rewe|bakery|sushi|burger)\b/i,
  ],
  [
    'Transport',
    'expense',
    /\b(uber|bolt|taxi|fuel|petrol|gas station|orlen|bp|shell|train|bus|tram|metro|ticket|parking|pkp|flixbus)\b/i,
  ],
  ['Housing', 'expense', /\b(rent|mortgage|czynsz|landlord)\b/i],
  [
    'Utilities',
    'expense',
    /\b(electricity|water bill|gas bill|internet|phone bill|utilities|prąd|prad)\b/i,
  ],
  [
    'Subscriptions',
    'expense',
    /\b(netflix|spotify|hbo|disney|youtube premium|icloud|subscription|apple music|chatgpt|claude)\b/i,
  ],
  ['Health', 'expense', /\b(pharmacy|apteka|doctor|dentist|medicine|gym|fitness|physio)\b/i],
  [
    'Entertainment',
    'expense',
    /\b(cinema|movie|concert|game|steam|tickets?|theatre|bar|beer|party)\b/i,
  ],
  [
    'Shopping',
    'expense',
    /\b(clothes|shoes|amazon|allegro|zalando|ikea|shopping|h&m|zara|electronics)\b/i,
  ],
  [
    'Travel',
    'expense',
    /\b(hotel|flight|airbnb|booking|ryanair|wizz|lot|vacation|holiday|trip)\b/i,
  ],
  ['Education', 'expense', /\b(course|book|books|udemy|school|tuition|training)\b/i],
  ['Salary', 'income', /\b(salary|paycheck|wypłata|wyplata|pensja|payroll)\b/i],
  ['Freelance', 'income', /\b(invoice|freelance|client payment|faktura)\b/i],
  ['Investments', 'income', /\b(dividend|interest|investment)\b/i],
  ['Gifts', 'income', /\b(gift|present|prezent)\b/i],
]

const INCOME_WORDS =
  /\b(got|received|earned|income|salary|paid me|refund|wypłata|wyplata|pensja|przychód|przychod)\b/i
const CURRENCY_WORDS: Record<string, string> = {
  zł: 'PLN',
  zl: 'PLN',
  pln: 'PLN',
  eur: 'EUR',
  '€': 'EUR',
  euro: 'EUR',
  usd: 'USD',
  $: 'USD',
  gbp: 'GBP',
  '£': 'GBP',
  chf: 'CHF',
}

export function parseTransactionText(input: string, today: ISODate): ParsedTransaction {
  let text = ` ${input.trim()} `
  const result: ParsedTransaction = {
    txn_type: 'expense',
    amount: null,
    currency: null,
    categoryName: null,
    merchant: null,
    description: null,
    occurred_on: today,
  }

  const amountMatch = text.match(
    /(?:^|\s)([$€£])?\s?(\d{1,3}(?:[ .]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s?(zł|zl|pln|eur|euro|usd|gbp|chf|€|\$|£)?(?=\s|$|[,.!])/i,
  )
  if (amountMatch) {
    result.amount = amountMatch[2]!.replace(/ /g, '')
    const cur = (amountMatch[1] ?? amountMatch[3] ?? '').toLowerCase()
    result.currency = CURRENCY_WORDS[cur] ?? null
    text = text.replace(amountMatch[0], ' ')
  }

  if (/\byesterday\b|\bwczoraj\b/i.test(text)) {
    result.occurred_on = addDaysISO(today, -1)
    text = text.replace(/\byesterday\b|\bwczoraj\b/i, ' ')
  }
  text = text.replace(/\btoday\b|\bdzisiaj\b|\bdziś\b/i, ' ')

  if (INCOME_WORDS.test(text)) result.txn_type = 'income'

  for (const [name, kind, re] of CATEGORY_KEYWORDS) {
    if (
      re.test(text) &&
      (kind === result.txn_type ||
        (kind === 'income' && result.txn_type === 'expense' && INCOME_WORDS.test(text)))
    ) {
      result.categoryName = name
      result.txn_type = kind
      break
    }
  }

  const merchantMatch = text.match(
    /\b(?:at|in|from|w|u)\s+([\p{L}\p{N}&'.-]+(?:\s[\p{Lu}][\p{L}\p{N}&'.-]*)*)/u,
  )
  if (merchantMatch) {
    result.merchant = merchantMatch[1]!.replace(/[.,!]+$/, '')
  } else {
    // A leading capitalised word ("Uber 23,50") is usually the merchant.
    const lead = input.trim().match(/^([\p{Lu}][\p{L}\p{N}&'.-]+)/u)
    if (lead && !/^(spent|paid|got|received|bought)$/i.test(lead[1]!)) result.merchant = lead[1]!
  }

  const cleaned = text
    .replace(/\b(spent|paid|bought|got|received|earned|on|for|at|in|from)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  result.description =
    cleaned && cleaned.toLowerCase() !== result.merchant?.toLowerCase()
      ? cleaned.slice(0, 120)
      : null
  return result
}
