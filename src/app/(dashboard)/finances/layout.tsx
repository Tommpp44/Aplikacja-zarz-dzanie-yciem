import { FinanceNav } from '@/components/finances/finance-nav'

export default function FinancesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Finances</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Your money: where it is, where it goes and where it&apos;s heading.
        </p>
      </div>
      <FinanceNav />
      {children}
    </>
  )
}
