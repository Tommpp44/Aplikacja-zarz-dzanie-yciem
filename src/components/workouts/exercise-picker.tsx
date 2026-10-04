'use client'

import { useRouter } from 'next/navigation'
import { NativeSelect } from '@/components/ui/native-select'

export function ExercisePicker({
  value,
  options,
}: {
  value: string
  options: { id: string; name: string }[]
}) {
  const router = useRouter()
  return (
    <NativeSelect
      aria-label="Exercise"
      value={value}
      className="w-full sm:w-56"
      onChange={(e) =>
        router.replace(`/workouts/exercises?exercise=${e.target.value}`, { scroll: false })
      }
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </NativeSelect>
  )
}
