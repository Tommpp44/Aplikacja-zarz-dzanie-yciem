'use client'

import { Upload } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { SubmitButton } from '@/components/ui/submit-button'
import { useServerAction } from '@/hooks/use-server-action'
import { importTransactions } from '@/lib/finance/actions'
import { csvToTransactions, type CsvTransactionRow } from '@/lib/finance/csv'
import type { AccountOption } from './types'

export function ImportDialog({ accounts }: { accounts: AccountOption[] }) {
  const [open, setOpen] = useState(false)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [rows, setRows] = useState<CsvTransactionRow[]>([])
  const [errors, setErrors] = useState<{ line: number; message: string }[]>([])
  const [fileName, setFileName] = useState('')
  const [pending, run] = useServerAction()

  const reset = () => {
    setRows([])
    setErrors([])
    setFileName('')
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={accounts.length === 0}>
        <Upload /> Import
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) reset()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import transactions (CSV)</DialogTitle>
            <DialogDescription>
              Columns needed: <code>date</code> and <code>amount</code> (negative = expense).
              Optional: type, category, merchant, description. Polish bank headers (data, kwota,
              odbiorca, opis) are recognised.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Field label="Into account" htmlFor="import-account">
              <NativeSelect
                id="import-account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="CSV file" htmlFor="import-file">
              <Input
                id="import-file"
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 5 * 1024 * 1024) {
                    setErrors([{ line: 0, message: 'File is larger than 5 MB.' }])
                    return
                  }
                  setFileName(file.name)
                  const result = csvToTransactions(await file.text())
                  setRows(result.rows)
                  setErrors(result.errors)
                }}
              />
            </Field>
            {fileName && (
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p>
                  <strong>{rows.length}</strong> transactions ready to import
                  {errors.length > 0 && (
                    <span className="text-warning"> · {errors.length} lines skipped</span>
                  )}
                </p>
                {errors.slice(0, 5).map((e) => (
                  <p key={e.line} className="text-muted-foreground text-xs">
                    Line {e.line}: {e.message}
                  </p>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <SubmitButton
              type="button"
              pending={pending}
              disabled={rows.length === 0 || !accountId}
              onClick={() =>
                run(() => importTransactions({ account_id: accountId, rows }), {
                  success: (d) =>
                    `Imported ${d.imported} transactions${d.skipped ? ` (${d.skipped} skipped)` : ''}`,
                  onSuccess: () => {
                    setOpen(false)
                    reset()
                  },
                })
              }
            >
              Import {rows.length || ''}
            </SubmitButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
