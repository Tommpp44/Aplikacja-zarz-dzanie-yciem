export type AccountOption = { id: string; name: string; currency: string; account_type: string }
export type CategoryOption = {
  id: string
  name: string
  kind: string
  color: string
  archived_at?: string | null
}

export type TransactionLike = {
  id: string
  account_id: string
  transfer_account_id: string | null
  txn_type: string
  amount_minor: number
  transfer_amount_minor: number | null
  currency: string
  occurred_on: string
  category_id?: string | null
  merchant: string | null
  description: string | null
  tags: string[]
  source?: string
}
