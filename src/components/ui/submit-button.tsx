'use client'

import * as React from 'react'
import { Button, type ButtonProps } from './button'
import { Spinner } from './spinner'

/** Button with a loading state that blocks double submits. */
function SubmitButton({
  pending,
  children,
  pendingLabel,
  disabled,
  type = 'submit',
  ...props
}: ButtonProps & { pending: boolean; pendingLabel?: string }) {
  return (
    <Button type={type} disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending && <Spinner />}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  )
}

export { SubmitButton }
