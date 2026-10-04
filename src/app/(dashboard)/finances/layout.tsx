import { FinanceNav } from '@/components/finances/finance-nav'
import { getT } from '@/lib/i18n/server'

export default async function FinancesLayout({ children }: { children: React.ReactNode }) {
  const t = await getT()
  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t('Finances')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("Your money: where it is, where it goes and where it's heading.")}
        </p>
      </div>
      <FinanceNav />
      {children}
    </>
  )
}
