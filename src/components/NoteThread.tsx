import { useState } from 'react'
import { useStore } from '../lib/store'
import { commentsForNote, notesForTarget, type NoteRecord } from '../lib/reducer'
import { newId } from '../lib/ids'
import { relativeTime } from '../lib/format'
import { MentionInput } from './MentionInput'
import { MentionText } from './MentionText'
import { Avatar, Button } from './common'
import { Icon } from './Icon'

function Composer({
  placeholder,
  onSave,
  submitOnEnter = false,
  minHeight = 40,
}: {
  placeholder: string
  onSave: (body: string) => void
  submitOnEnter?: boolean
  minHeight?: number
}) {
  const [body, setBody] = useState('')
  const [k, setK] = useState(0)
  const save = () => {
    if (!body.trim()) return
    onSave(body)
    setBody('')
    setK((v) => v + 1)
  }
  return (
    <div className="space-y-2">
      <MentionInput
        key={k}
        value=""
        onChange={setBody}
        placeholder={placeholder}
        submitOnEnter={submitOnEnter}
        onSubmit={save}
        minHeight={minHeight}
      />
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={save}>
          <Icon name="CornerDownLeft" size={14} /> {submitOnEnter ? 'Reply' : 'Add note'}
        </Button>
        {submitOnEnter && (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Enter to send · Shift+Enter for a new line
          </span>
        )}
      </div>
    </div>
  )
}

function Note({ note }: { note: NoteRecord }) {
  const { state, dispatch } = useStore()
  const comments = commentsForNote(state, note.id)
  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
      <div className="p-3">
        <div className="mb-2 flex items-center gap-2">
          <Avatar actor={note.createdBy} size={20} />
          <span className="text-sm font-medium">{note.createdBy?.name ?? 'unknown'}</span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {relativeTime(note.createdAt)}
          </span>
          <button
            type="button"
            title="Archive note"
            onClick={() => void dispatch({ type: 'note.archive', subject: note.id })}
            className="ml-auto opacity-40 hover:opacity-100"
          >
            <Icon name="Archive" size={14} />
          </button>
        </div>
        <MentionText body={note.body} className="text-sm" />
      </div>

      {comments.length > 0 && (
        <div className="space-y-3 border-t px-3 py-3" style={{ borderColor: 'var(--border)' }}>
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar actor={c.createdBy} size={20} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{c.createdBy?.name ?? 'unknown'}</span>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    {relativeTime(c.createdAt)}
                  </span>
                </div>
                <MentionText body={c.body} className="text-sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t px-3 py-3" style={{ borderColor: 'var(--border)' }}>
        <Composer
          placeholder="Reply…"
          submitOnEnter
          onSave={(body) =>
            void dispatch({ type: 'comment.create', subject: newId('cmt'), data: { note: note.id, body } })
          }
        />
      </div>
    </div>
  )
}

export function NoteThread({ targetId }: { targetId: string }) {
  const { state, dispatch } = useStore()
  const notes = notesForTarget(state, targetId)
  return (
    <div className="space-y-4">
      <Composer
        placeholder="Log a note or conversation… (type @ to link a person, org, or deal)"
        minHeight={64}
        onSave={(body) =>
          void dispatch({ type: 'note.create', subject: newId('note'), data: { target: targetId, body } })
        }
      />
      {notes.length === 0 ? (
        <p className="py-4 text-center text-sm" style={{ color: 'var(--muted)' }}>
          No notes yet. Capture your first conversation above.
        </p>
      ) : (
        notes.map((n) => <Note key={n.id} note={n} />)
      )}
    </div>
  )
}
