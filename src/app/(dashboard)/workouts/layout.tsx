import { SubNav } from '@/components/shared/sub-nav'

export default function WorkoutsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SubNav
        label="Workout sections"
        links={[
          { href: '/workouts', label: 'Overview', exact: true },
          { href: '/workouts/exercises', label: 'Exercises' },
          { href: '/workouts/plans', label: 'Plans & templates' },
        ]}
      />
      {children}
    </>
  )
}
