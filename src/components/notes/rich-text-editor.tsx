'use client'

import { Placeholder } from '@tiptap/extensions'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/client'

/** Tiptap editor (loaded lazily). Content is HTML constrained by the editor schema. */
export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing…',
  editable = true,
}: {
  content: string
  onChange?: (html: string, text: string) => void
  placeholder?: string
  editable?: boolean
}) {
  const t = useT()
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: true,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose-lifeos min-h-[50vh] outline-none',
        'aria-label': t('Note content'),
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML(), editor.getText()),
  })

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            strike: e.isActive('strike'),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            quote: e.isActive('blockquote'),
            code: e.isActive('codeBlock'),
          }
        : null,
  })

  if (!editor)
    return <div className="bg-muted/50 min-h-[50vh] animate-pulse rounded-lg" aria-hidden />

  const tools = [
    {
      key: 'bold',
      icon: Bold,
      label: t('Bold'),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic',
      icon: Italic,
      label: t('Italic'),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: 'strike',
      icon: Strikethrough,
      label: t('Strikethrough'),
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      key: 'h2',
      icon: Heading2,
      label: t('Heading'),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: 'h3',
      icon: Heading3,
      label: t('Subheading'),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      key: 'bullet',
      icon: List,
      label: t('Bullet list'),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'ordered',
      icon: ListOrdered,
      label: t('Numbered list'),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: 'quote',
      icon: Quote,
      label: t('Quote'),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      key: 'code',
      icon: Code,
      label: t('Code block'),
      run: () => editor.chain().focus().toggleCodeBlock().run(),
    },
  ] as const

  return (
    <div className="flex flex-col gap-3">
      {editable && (
        <div
          role="toolbar"
          aria-label={t('Formatting')}
          className="bg-background/90 sticky top-14 z-10 -mx-1 flex flex-wrap gap-0.5 px-1 py-1 backdrop-blur"
        >
          {tools.map((it) => {
            const Icon = it.icon
            const active = state?.[it.key as keyof NonNullable<typeof state>] ?? false
            return (
              <button
                key={it.key}
                type="button"
                aria-label={it.label}
                aria-pressed={active}
                onClick={it.run}
                className={cn(
                  'text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-md',
                  active && 'bg-accent text-foreground',
                )}
              >
                <Icon className="size-4" />
              </button>
            )
          })}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
