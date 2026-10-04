'use client'

import { Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
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
import { createExercise, deleteExercise } from '@/lib/workouts/actions'
import { useT } from '@/lib/i18n/client'

type Exercise = {
  id: string
  name: string
  category: string
  muscle_group: string | null
  equipment: string | null
  user_id: string | null
  pr?: string | null
}

export function ExerciseLibrary({ exercises }: { exercises: Exercise[] }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: 'strength' as 'strength' | 'cardio' | 'mobility' | 'other',
    muscle_group: '',
    equipment: '',
  })
  const [pending, run] = useServerAction()
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? exercises.filter((e) =>
          `${e.name} ${e.muscle_group ?? ''} ${e.equipment ?? ''}`.toLowerCase().includes(q),
        )
      : exercises
  }, [exercises, query])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search exercises')}
            aria-label={t('Search exercises')}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus /> {t('Custom exercise')}
        </Button>
      </div>
      <ul className="bg-card divide-y rounded-xl border">
        {filtered.map((e) => (
          <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{e.name}</p>
              <p className="text-muted-foreground truncate text-xs">
                {[e.muscle_group, e.equipment].filter(Boolean).join(' · ')}
              </p>
            </div>
            {e.pr && <span className="text-muted-foreground tabular text-xs">{e.pr}</span>}
            <Badge variant="secondary" className="capitalize">
              {e.category}
            </Badge>
            {e.user_id && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('Delete {name}', { name: e.name })}
                onClick={() =>
                  run(() => deleteExercise({ id: e.id }), { success: t('Exercise deleted') })
                }
              >
                <Trash2 />
              </Button>
            )}
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Custom exercise')}</DialogTitle>
            <DialogDescription>{t('Add movements that are not in the library.')}</DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              run(() => createExercise(form), {
                success: t('Exercise added'),
                onSuccess: () => {
                  setOpen(false)
                  setForm({ name: '', category: 'strength', muscle_group: '', equipment: '' })
                },
              })
            }}
          >
            <Field label={t('Name')} htmlFor="ex-name">
              <Input
                id="ex-name"
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t('Category')} htmlFor="ex-cat">
                <NativeSelect
                  id="ex-cat"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as typeof form.category })
                  }
                >
                  <option value="strength">{t('Strength')}</option>
                  <option value="cardio">{t('Cardio')}</option>
                  <option value="mobility">{t('Mobility')}</option>
                  <option value="other">{t('Other')}</option>
                </NativeSelect>
              </Field>
              <Field label={t('Muscle group')} htmlFor="ex-muscle" optional>
                <Input
                  id="ex-muscle"
                  value={form.muscle_group}
                  onChange={(e) => setForm({ ...form, muscle_group: e.target.value })}
                />
              </Field>
              <Field label={t('Equipment')} htmlFor="ex-eq" optional>
                <Input
                  id="ex-eq"
                  value={form.equipment}
                  onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                />
              </Field>
            </div>
            <DialogFooter>
              <SubmitButton pending={pending}>{t('Add exercise')}</SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
