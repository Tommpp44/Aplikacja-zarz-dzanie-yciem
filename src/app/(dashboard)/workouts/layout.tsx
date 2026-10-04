import { SubNav } from '@/components/shared/sub-nav'
import { getT } from '@/lib/i18n/server'

export default async function WorkoutsLayout({ children }: { children: React.ReactNode }) {
  const t = await getT()
  return (
    <>
      <SubNav
        label={t('Workout sections')}
        links={[
          { href: '/workouts', label: t('Overview'), exact: true },
          { href: '/workouts/exercises', label: t('Exercises') },
          { href: '/workouts/plans', label: t('Plans & templates') },
        ]}
      />
      {children}
    </>
  )
}
