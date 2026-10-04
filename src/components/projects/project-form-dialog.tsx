'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { ColorPicker } from '@/components/shared/color-picker'
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
import { Textarea } from '@/components/ui/textarea'
import { useServerAction } from '@/hooks/use-server-action'
import { createProject, updateProject } from '@/lib/projects/actions'
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  projectSchema,
  type ProjectInput,
} from '@/lib/projects/schemas'
import { useT } from '@/lib/i18n/client'

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  goals,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: ProjectInput & { id: string }
  goals: { id: string; title: string }[]
}) {
  const t = useT()
  const router = useRouter()
  const [pending, run] = useServerAction()
  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ?? {
      name: '',
      description: '',
      status: 'active',
      priority: 3,
      color: 'indigo',
      deadline: null,
      goal_id: null,
    },
  })
  useEffect(() => {
    if (open)
      form.reset(
        project ?? {
          name: '',
          description: '',
          status: 'active',
          priority: 3,
          color: 'indigo',
          deadline: null,
          goal_id: null,
        },
      )
  }, [open, project, form])

  const submit = form.handleSubmit((values) => {
    const clean = { ...values, deadline: values.deadline || null, goal_id: values.goal_id || null }
    run(() => (project ? updateProject({ id: project.id, ...clean }) : createProject(clean)), {
      success: project ? t('Project updated') : t('Project created'),
      onSuccess: (data) => {
        onOpenChange(false)
        if (!project) router.push(`/projects/${data.id}`)
      },
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? t('Edit project') : t('New project')}</DialogTitle>
          <DialogDescription>
            {t('A project is a set of tasks that leads to one outcome.')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <Field
            label={t('Name')}
            htmlFor="project-name"
            error={form.formState.errors.name?.message}
          >
            <Input
              id="project-name"
              autoFocus
              placeholder={t('Move to Berlin')}
              {...form.register('name')}
            />
          </Field>
          <Field label={t('Description')} htmlFor="project-description" optional>
            <Textarea id="project-description" rows={3} {...form.register('description')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Status')} htmlFor="project-status">
              <NativeSelect id="project-status" {...form.register('status')}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(PROJECT_STATUS_LABELS[s])}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('Priority')} htmlFor="project-priority">
              <NativeSelect
                id="project-priority"
                {...form.register('priority', { valueAsNumber: true })}
              >
                {[1, 2, 3, 4].map((p) => (
                  <option key={p} value={p}>
                    P{p}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('Deadline')} htmlFor="project-deadline" optional>
              <Input id="project-deadline" type="date" {...form.register('deadline')} />
            </Field>
            <Field label={t('Linked goal')} htmlFor="project-goal" optional>
              <NativeSelect id="project-goal" {...form.register('goal_id')}>
                <option value="">{t('None')}</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field label={t('Color')}>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <ColorPicker value={field.value ?? 'indigo'} onChange={field.onChange} />
              )}
            />
          </Field>
          <DialogFooter>
            <SubmitButton pending={pending}>
              {project ? t('Save') : t('Create project')}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
