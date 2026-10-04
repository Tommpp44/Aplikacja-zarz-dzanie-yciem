'use client'

import { ENTITY_COLORS, colorClass, type EntityColor } from '@/lib/colors'
import { cn } from '@/lib/utils'

export function ColorPicker({
  value,
  onChange,
  label = 'Color',
}: {
  value: string
  onChange: (c: EntityColor) => void
  label?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {ENTITY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={c}
          onClick={() => onChange(c)}
          className={cn(
            'ring-offset-background size-6 rounded-full ring-offset-2 transition-shadow',
            colorClass(c, 'bg'),
            value === c && 'ring-ring ring-2',
          )}
        />
      ))}
    </div>
  )
}
