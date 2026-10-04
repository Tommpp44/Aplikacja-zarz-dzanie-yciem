import { CategoryManager } from '@/components/finances/category-manager'
import { listCategories } from '@/lib/finance/repository'
import { getOnboardedUserContext } from '@/lib/settings/service'
import { getT, pageTitle } from '@/lib/i18n/server'

export const generateMetadata = pageTitle('Categories')

export default async function CategoriesPage() {
  const t = await getT()
  const { supabase, user } = await getOnboardedUserContext()
  const categories = await listCategories(supabase, user.id, true)
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section aria-labelledby="exp">
        <h2 id="exp" className="mb-3 text-sm font-semibold">
          {t('Expense categories')}
        </h2>
        <CategoryManager categories={categories} kind="expense" />
      </section>
      <section aria-labelledby="inc">
        <h2 id="inc" className="mb-3 text-sm font-semibold">
          {t('Income categories')}
        </h2>
        <CategoryManager categories={categories} kind="income" />
      </section>
      <p className="text-muted-foreground text-xs md:col-span-2">
        {t(
          'Archiving keeps past transactions categorised but hides the category from new entries.',
        )}
      </p>
    </div>
  )
}
