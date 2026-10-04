'use client'

import * as React from 'react'
import { useT } from '@/lib/i18n/client'
import { cn } from '@/lib/utils'
import { Label } from './label'

/** Label + control + error/hint, wired for accessibility. */
function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
  optional,
}: {
  label: React.ReactNode
  htmlFor?: string
  error?: string
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
  optional?: boolean
}) {
  const t = useT()
  const describedBy = htmlFor ? `${htmlFor}-${error ? 'error' : 'hint'}` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="text-muted-foreground font-normal"> ({t('optional')})</span>}
      </Label>
      {React.isValidElement<{ 'aria-invalid'?: boolean; 'aria-describedby'?: string }>(children)
        ? React.cloneElement(children, {
            'aria-invalid': error ? true : undefined,
            'aria-describedby': error || hint ? describedBy : undefined,
          })
        : children}
      {error ? (
        <p id={describedBy} role="alert" className="text-destructive text-xs">
          {t(error)}
        </p>
      ) : hint ? (
        <p id={describedBy} className="text-muted-foreground text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export { Field }
