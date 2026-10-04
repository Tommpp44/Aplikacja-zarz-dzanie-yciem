import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createTransaction = vi.fn()
vi.mock('@/lib/finance/actions', () => ({
  createTransaction: (...a: unknown[]) => createTransaction(...a),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  restoreTransaction: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const { TransactionForm } = await import('./transaction-form')

const accounts = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Main',
    currency: 'PLN',
    account_type: 'checking',
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Savings',
    currency: 'PLN',
    account_type: 'savings',
  },
]
const categories = [
  { id: '00000000-0000-4000-8000-0000000000f1', name: 'Food', kind: 'expense', color: 'emerald' },
  {
    id: '00000000-0000-4000-8000-0000000000f2',
    name: 'Transport',
    kind: 'expense',
    color: 'amber',
  },
  { id: '00000000-0000-4000-8000-0000000000f3', name: 'Salary', kind: 'income', color: 'emerald' },
]

describe('TransactionForm', () => {
  beforeEach(() => createTransaction.mockReset().mockResolvedValue({ ok: true, data: { id: 'x' } }))

  it('saves an expense with smart defaults (today, last account)', async () => {
    render(
      <TransactionForm
        accounts={accounts}
        categories={categories}
        today="2026-10-04"
        lastUsed={{ account_id: accounts[1]!.id }}
      />,
    )
    await userEvent.type(screen.getByLabelText(/Amount/), '54,50')
    await userEvent.click(screen.getByRole('button', { name: 'Food' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save expense' }))
    await vi.waitFor(() => expect(createTransaction).toHaveBeenCalled())
    expect(createTransaction.mock.calls[0]![0]).toMatchObject({
      txn_type: 'expense',
      amount: '54,50',
      account_id: accounts[1]!.id,
      category_id: categories[0]!.id,
      occurred_on: '2026-10-04',
    })
  })

  it('fills the form from natural language', async () => {
    render(<TransactionForm accounts={accounts} categories={categories} today="2026-10-04" />)
    await userEvent.type(
      screen.getByLabelText('Describe the transaction in words'),
      'Spent 54 PLN on groceries at Lidl{Enter}',
    )
    expect(screen.getByLabelText(/Amount/)).toHaveValue('54')
    expect(screen.getByRole('button', { name: 'Food' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText(/Merchant/)).toHaveValue('Lidl')
  })

  it('validates the amount before calling the server', async () => {
    render(<TransactionForm accounts={accounts} categories={categories} today="2026-10-04" />)
    await userEvent.click(screen.getByRole('button', { name: 'Save expense' }))
    expect(await screen.findByText('Enter an amount')).toBeInTheDocument()
    expect(createTransaction).not.toHaveBeenCalled()
  })

  it('asks to add an account first when there are none', () => {
    render(<TransactionForm accounts={[]} categories={categories} today="2026-10-04" />)
    expect(screen.getByRole('link', { name: 'Add account' })).toHaveAttribute(
      'href',
      '/finances/accounts?new=1',
    )
  })
})
