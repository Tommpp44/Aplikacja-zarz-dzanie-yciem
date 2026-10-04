import type { Metadata } from 'next'
import { CategoryManager } from '@/components/finances/category-manager'
import { listCategories } from '@/lib/finance/repository'
import { getOnboardedUserContext } from '@/lib/settings/service'

export const metadata: Metadata = { title: 'Categories' }

export default async function CategoriesPage() {
  const { supabase, user } = await getOnboardedUserContext()
  const categories = await listCategories(supabase, user.id, true)
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section aria-labelledby="exp">
        <h2 id="exp" className="mb-3 text-sm font-semibold">
          Expense categories
        </h2>
        <CategoryManager categories={categories} kind="expense" />
      </section>
      <section aria-labelledby="inc">
        <h2 id="inc" className="mb-3 text-sm font-semibold">
          Income categories
        </h2>
        <CategoryManager categories={categories} kind="income" />
      </section>
      <p className="text-muted-foreground text-xs md:col-span-2">
        Archiving keeps past transactions categorised but hides the category from new entries.
      </p>
    </div>
  )
}
