'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Undo2,
  Redo2,
  Unlink,
} from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn(active && 'bg-muted')}
    >
      {children}
    </Button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write the article body…',
  disabled = false,
  id,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: 'rich-text-editor-content',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(!disabled)
  }, [editor, disabled])

  function setLink() {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', previousUrl ?? 'https://')

    if (url === null) return

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  if (!editor) {
    return (
      <div
        className={cn(
          'rich-text-editor min-h-48 rounded-lg border border-input bg-background',
          disabled && 'opacity-50',
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'rich-text-editor overflow-hidden rounded-lg border border-input bg-background ring-offset-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        disabled && 'opacity-50',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5">
        <ToolbarButton
          label="Bold"
          disabled={disabled}
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          disabled={disabled}
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <ToolbarButton
          label="Heading 2"
          disabled={disabled}
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          disabled={disabled}
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <ToolbarButton
          label="Bullet list"
          disabled={disabled}
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          disabled={disabled}
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <ToolbarButton
          label="Add link"
          disabled={disabled}
          active={editor.isActive('link')}
          onClick={setLink}
        >
          <Link2 />
        </ToolbarButton>
        {editor.isActive('link') && (
          <ToolbarButton
            label="Remove link"
            disabled={disabled}
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <Unlink />
          </ToolbarButton>
        )}

        <span className="mx-1 h-5 w-px bg-border" aria-hidden />

        <ToolbarButton
          label="Undo"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
