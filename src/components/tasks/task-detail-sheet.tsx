'use client'

import { Link2, Paperclip, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { RepeatRulePicker } from '@/components/shared/repeat-rule-picker'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { SubmitButton } from '@/components/ui/submit-button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useServerAction } from '@/hooks/use-server-action'
import type { ISODate } from '@/lib/dates'
import { parseRepeatRule, type RepeatRule } from '@/lib/recurrence'
import {
  addAttachment,
  addDependency,
  deleteTask,
  getTaskDetails,
  removeAttachment,
  removeDependency,
  restoreTask,
  searchTasksForLinking,
  toggleTaskCompleted,
  updateTask,
} from '@/lib/tasks/actions'
import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from '@/lib/tasks/schemas'
import { QuickAddBar } from './quick-add-bar'
import type { TaskOptions } from './types'

type Details = NonNullable<
  Extract<Awaited<ReturnType<typeof getTaskDetails>>, { ok: true }>['data']
>

type FormState = {
  title: string
  description: string
  notes: string
  status: TaskStatus
  priority: number
  due_date: string
  due_time: string
  duration_minutes: string
  repeat_rule: RepeatRule | null
  is_someday: boolean
  project_id: string
  goal_id: string
  tags: string
  reminder_at: string
}

function toForm(d: Details): FormState {
  const t = d.task
  return {
    title: t.title,
    description: t.description ?? '',
    notes: t.notes ?? '',
    status: t.status as TaskStatus,
    priority: t.priority,
    due_date: t.due_date ?? '',
    due_time: t.due_time?.slice(0, 5) ?? '',
    duration_minutes: t.duration_minutes ? String(t.duration_minutes) : '',
    repeat_rule: parseRepeatRule(t.repeat_rule),
    is_someday: t.is_someday,
    project_id: t.project_id ?? '',
    goal_id: t.goal_id ?? '',
    tags: t.task_tags
      .map((x) => x.tag?.name)
      .filter(Boolean)
      .join(', '),
    reminder_at: t.reminder_at ? toLocalInput(t.reminder_at) : '',
  }
}

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function TaskDetailSheet({
  taskId,
  onClose,
  today,
  options,
  weekStartsOn,
}: {
  taskId: string | null
  onClose: () => void
  today: ISODate
  options: TaskOptions
  weekStartsOn: 0 | 1
}) {
  const [details, setDetails] = useState<Details | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, startLoading] = useTransition()
  const [saving, run] = useServerAction()
  const [, runQuiet] = useServerAction()

  const load = useCallback(
    (id: string) =>
      startLoading(async () => {
        const result = await getTaskDetails({ id })
        if (!result.ok || !result.data) {
          toast.error(result.ok ? 'This task no longer exists.' : result.error)
          onClose()
          return
        }
        setDetails(result.data)
        setForm(toForm(result.data))
        setErrors({})
      }),
    [onClose],
  )

  useEffect(() => {
    if (taskId) load(taskId)
    else {
      setDetails(null)
      setForm(null)
    }
  }, [taskId, load])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f))

  const save = () => {
    if (!form || !details) return
    run(
      () =>
        updateTask({
          id: details.task.id,
          title: form.title,
          description: form.description || null,
          notes: form.notes || null,
          status: form.status,
          priority: form.priority,
          due_date: form.due_date || null,
          due_time: form.due_date && form.due_time ? form.due_time : null,
          duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
          repeat_rule: form.repeat_rule,
          is_someday: form.is_someday,
          project_id: form.project_id || null,
          goal_id: form.goal_id || null,
          reminder_at: form.reminder_at ? new Date(form.reminder_at).toISOString() : null,
          tag_names: form.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      {
        success: 'Task updated',
        onSuccess: () => onClose(),
        onError: (r) => setErrors(r.fieldErrors ?? {}),
      },
    )
  }

  const remove = () => {
    if (!details) return
    const id = details.task.id
    run(() => deleteTask({ id }), {
      success: 'Task deleted',
      undo: { action: () => restoreTask({ id }) },
      onSuccess: () => onClose(),
    })
  }

  return (
    <Sheet open={Boolean(taskId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Task</SheetTitle>
          <SheetDescription>Edit details, subtasks, links and notes.</SheetDescription>
        </SheetHeader>
        {!form || !details || loading ? (
          <div className="flex flex-col gap-3 px-5">
            <Skeleton className="h-9" />
            <Skeleton className="h-20" />
            <Skeleton className="h-9" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-5 pb-8">
            <Field label="Title" htmlFor="task-title" error={errors.title}>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={500}
              />
            </Field>
            <Field label="Description" htmlFor="task-description" optional>
              <Textarea
                id="task-description"
                rows={3}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status" htmlFor="task-status">
                <NativeSelect
                  id="task-status"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as TaskStatus)}
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Priority" htmlFor="task-priority">
                <NativeSelect
                  id="task-priority"
                  value={form.priority}
                  onChange={(e) => set('priority', Number(e.target.value))}
                >
                  <option value={1}>P1 — Urgent</option>
                  <option value={2}>P2 — High</option>
                  <option value={3}>P3 — Medium</option>
                  <option value={4}>P4 — Low</option>
                </NativeSelect>
              </Field>
              <Field label="Due date" htmlFor="task-due" error={errors.due_date}>
                <Input
                  id="task-due"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => set('due_date', e.target.value)}
                />
              </Field>
              <Field label="Time" htmlFor="task-time" error={errors.due_time}>
                <Input
                  id="task-time"
                  type="time"
                  value={form.due_time}
                  disabled={!form.due_date}
                  onChange={(e) => set('due_time', e.target.value)}
                />
              </Field>
              <Field label="Duration (min)" htmlFor="task-duration">
                <Input
                  id="task-duration"
                  type="number"
                  min={1}
                  max={1440}
                  value={form.duration_minutes}
                  onChange={(e) => set('duration_minutes', e.target.value)}
                />
              </Field>
              <Field label="Reminder" htmlFor="task-reminder">
                <Input
                  id="task-reminder"
                  type="datetime-local"
                  value={form.reminder_at}
                  onChange={(e) => set('reminder_at', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Repeat" htmlFor="task-repeat">
              <RepeatRulePicker
                id="task-repeat"
                value={form.repeat_rule}
                onChange={(r) => set('repeat_rule', r)}
                weekStartsOn={weekStartsOn}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Project" htmlFor="task-project">
                <NativeSelect
                  id="task-project"
                  value={form.project_id}
                  onChange={(e) => set('project_id', e.target.value)}
                >
                  <option value="">No project</option>
                  {options.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Goal" htmlFor="task-goal">
                <NativeSelect
                  id="task-goal"
                  value={form.goal_id}
                  onChange={(e) => set('goal_id', e.target.value)}
                >
                  <option value="">No goal</option>
                  {options.goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field label="Tags" htmlFor="task-tags" hint="Comma separated">
              <Input
                id="task-tags"
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="errands, home"
              />
            </Field>
            <label className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              Someday / maybe
              <Switch checked={form.is_someday} onCheckedChange={(v) => set('is_someday', v)} />
            </label>

            <section className="flex flex-col gap-2" aria-labelledby="subtasks-heading">
              <h3 id="subtasks-heading" className="text-sm font-medium">
                Subtasks
              </h3>
              <ul className="flex flex-col">
                {details.subtasks.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 py-1 text-sm">
                    <Checkbox
                      checked={s.status === 'completed'}
                      aria-label={`Complete ${s.title}`}
                      onCheckedChange={(v) =>
                        runQuiet(() => toggleTaskCompleted({ id: s.id, completed: v === true }), {
                          onSuccess: () => load(details.task.id),
                        })
                      }
                    />
                    <span
                      className={
                        s.status === 'completed' ? 'text-muted-foreground line-through' : ''
                      }
                    >
                      {s.title}
                    </span>
                  </li>
                ))}
              </ul>
              <QuickAddBar
                today={today}
                parentTaskId={details.task.id}
                placeholder="Add a subtask"
                onCreated={() => load(details.task.id)}
              />
            </section>

            <DependencySection details={details} onChange={() => load(details.task.id)} />
            <AttachmentSection details={details} onChange={() => load(details.task.id)} />

            <Field label="Notes" htmlFor="task-notes" optional>
              <Textarea
                id="task-notes"
                rows={4}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Field>

            <div className="bg-popover sticky bottom-0 -mx-5 flex items-center justify-between gap-2 border-t px-5 py-3">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={remove}
              >
                <Trash2 /> Delete
              </Button>
              <SubmitButton type="button" pending={saving} onClick={save}>
                Save changes
              </SubmitButton>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DependencySection({ details, onChange }: { details: Details; onChange: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ id: string; title: string }[]>([])
  const [, run] = useServerAction()
  const taskId = details.task.id

  useEffect(() => {
    if (!query.trim()) return
    const handle = setTimeout(async () => {
      const res = await searchTasksForLinking({ query, excludeId: taskId })
      if (res.ok) setResults(res.data)
    }, 200)
    return () => clearTimeout(handle)
  }, [query, taskId])

  return (
    <section className="flex flex-col gap-2" aria-labelledby="deps-heading">
      <h3 id="deps-heading" className="text-sm font-medium">
        Blocked by
      </h3>
      {details.dependencyTasks.length > 0 && (
        <ul className="flex flex-col gap-1">
          {details.dependencyTasks.map((d) => (
            <li
              key={d.id}
              className="bg-muted flex items-center gap-2 rounded-md px-2 py-1 text-sm"
            >
              <Link2 className="text-muted-foreground size-3.5" aria-hidden />
              <span className={d.status === 'completed' ? 'line-through' : ''}>{d.title}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground ml-auto"
                aria-label={`Remove dependency ${d.title}`}
                onClick={() =>
                  run(() => removeDependency({ task_id: taskId, depends_on_task_id: d.id }), {
                    onSuccess: onChange,
                  })
                }
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a task this depends on…"
        aria-label="Search dependency"
      />
      {query && results.length > 0 && (
        <ul className="flex flex-col rounded-md border">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="hover:bg-accent w-full px-3 py-1.5 text-left text-sm"
                onClick={() =>
                  run(() => addDependency({ task_id: taskId, depends_on_task_id: r.id }), {
                    onSuccess: () => {
                      setQuery('')
                      setResults([])
                      onChange()
                    },
                  })
                }
              >
                {r.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AttachmentSection({ details, onChange }: { details: Details; onChange: () => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [pending, run] = useServerAction()
  return (
    <section className="flex flex-col gap-2" aria-labelledby="att-heading">
      <h3 id="att-heading" className="text-sm font-medium">
        Attachments
      </h3>
      {details.task.attachments.length > 0 && (
        <ul className="flex flex-col gap-1">
          {details.task.attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm">
              <Paperclip className="text-muted-foreground size-3.5" aria-hidden />
              <a
                href={a.url ?? '#'}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary truncate hover:underline"
              >
                {a.name}
              </a>
              <button
                type="button"
                aria-label={`Remove ${a.name}`}
                className="text-muted-foreground hover:text-foreground ml-auto"
                onClick={() => run(() => removeAttachment({ id: a.id }), { onSuccess: onChange })}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          aria-label="Attachment name"
          className="w-1/3"
        />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          aria-label="Attachment link"
          type="url"
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending || !url}
          onClick={() =>
            run(() => addAttachment({ task_id: details.task.id, name: name || url, url }), {
              onSuccess: () => {
                setName('')
                setUrl('')
                onChange()
              },
            })
          }
        >
          Add
        </Button>
      </div>
    </section>
  )
}
