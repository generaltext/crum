import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { entitiesOfKind } from '../lib/reducer'
import { KINDS, titleField, type FieldDef } from '../lib/model'
import { formatDateTime } from '../lib/format'
import { MentionInput } from '../components/MentionInput'
import { MentionText } from '../components/MentionText'
import { EntityLink } from '../components/EntityLink'
import { NoteThread } from '../components/NoteThread'
import { RelationField } from '../components/RelationField'
import { TagEditor } from '../components/TagEditor'
import { ActorStamp, Button, EmptyState } from '../components/common'
import { Icon, type IconName } from '../components/Icon'

function EditableText({
  value,
  placeholder,
  type = 'text',
  className = '',
  onSave,
}: {
  value: string
  placeholder?: string | undefined
  type?: 'text' | 'email' | 'url' | 'number'
  className?: string
  onSave: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [v, setV] = useState(value)
  useEffect(() => setV(value), [value])
  const commit = () => {
    if (v !== value) onSave(v)
    setEditing(false)
  }
  if (editing) {
    return (
      <input
        autoFocus
        value={v}
        inputMode={type === 'number' ? 'decimal' : undefined}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setV(value)
            setEditing(false)
          }
        }}
        placeholder={placeholder}
        className={`rounded-md border px-2 py-1 outline-none ${className}`}
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      />
    )
  }
  const display = value.trim()
  return (
    <span
      onClick={() => setEditing(true)}
      className={`inline-block cursor-text rounded-md px-2 py-1 hover:bg-[var(--hover)] ${className}`}
      style={!display ? { color: 'var(--muted)' } : undefined}
    >
      {display || placeholder || 'Add…'}
    </span>
  )
}

function RichField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  if (editing) {
    return (
      <div className="space-y-2">
        <MentionInput value={value} onChange={setDraft} autoFocus minHeight={80} placeholder="Type @ to link…" />
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              onSave(draft)
              setEditing(false)
            }}
          >
            Save
          </Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="group relative">
      {value.trim() ? (
        <MentionText body={value} className="text-sm" />
      ) : (
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          No description
        </span>
      )}
      <button
        type="button"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className="absolute right-0 top-0 opacity-0 group-hover:opacity-60 hover:!opacity-100"
        title="Edit"
      >
        <Icon name="Pencil" size={14} />
      </button>
    </div>
  )
}

function RefField({ refKind, value, onSave }: { refKind: string; value: string; onSave: (v: string) => void }) {
  const { state } = useStore()
  const options = entitiesOfKind(state, refKind as never)
  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onSave(e.target.value)}
        className="rounded-md border px-2 py-1 text-sm outline-none"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {String(o.fields[titleField(o.kind)] ?? '') || 'Untitled'}
          </option>
        ))}
      </select>
      {value && <EntityLink id={value} />}
    </div>
  )
}

export function EntityDetail() {
  const { id = '' } = useParams()
  const { state, config, dispatch } = useStore()
  const navigate = useNavigate()
  const rec = state.entities[id]

  if (!rec) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-6">
        <EmptyState icon="Search" title="Not found" hint="This record may have been removed." />
      </div>
    )
  }

  const def = KINDS[rec.kind]
  const tkey = titleField(rec.kind)
  const title = String(rec.fields[tkey] ?? '')
  const update = (key: string, val: string) => {
    const value = def.fields.find((f) => f.key === key)?.type === 'number' ? Number(val) || 0 : val
    void dispatch({ type: `${rec.kind}.update`, subject: id, data: { [key]: value } })
  }

  const richFields = def.fields.filter((f) => f.type === 'rich')
  const scalarFields = def.fields.filter((f) => !f.title && f.type !== 'rich')

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      {rec.archived && (
        <div className="mb-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)', background: 'var(--hover)' }}>
          <Icon name="Archive" size={15} />
          <span>This {def.singular.toLowerCase()} is archived.</span>
          <button className="ml-auto font-medium" style={{ color: 'var(--accent)' }} onClick={() => void dispatch({ type: `${rec.kind}.restore`, subject: id })}>
            Restore
          </button>
        </div>
      )}

      <header className="mb-4">
        <div className="mb-1 flex items-center gap-2">
          <Icon name={def.icon as IconName} size={16} style={{ color: 'var(--muted)' }} />
          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            {def.singular}
          </span>
          <button
            type="button"
            onClick={() => {
              void dispatch({ type: `${rec.kind}.archive`, subject: id })
              navigate(`/${def.route}`)
            }}
            className="ml-auto flex items-center gap-1 text-xs opacity-60 hover:opacity-100"
            title="Archive"
          >
            <Icon name="Archive" size={13} /> Archive
          </button>
        </div>
        <EditableText
          value={title}
          placeholder={def.fields.find((f) => f.title)?.placeholder ?? 'Untitled'}
          className="-ml-2 text-2xl font-semibold"
          onSave={(v) => update(tkey, v)}
        />
        <div className="ml-0.5 mt-1">
          <ActorStamp actor={rec.createdBy} ts={rec.createdAt} prefix="Added by" />
        </div>
      </header>

      {/* Deal stage pipeline */}
      {rec.kind === 'deal' && (
        <section className="mb-5">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {config.stages.map((s) => {
              const activeStage = String(rec.fields.stage ?? '') === s.key
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() =>
                    void dispatch({ type: 'deal.stage_change', subject: id, data: { from: rec.fields.stage ?? null, to: s.key } })
                  }
                  className="rounded-md border px-2.5 py-1 text-xs font-medium"
                  style={
                    activeStage
                      ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
                      : { borderColor: 'var(--border)' }
                  }
                >
                  {s.label}
                </button>
              )
            })}
          </div>
          {(state.dealStages[id]?.length ?? 0) > 0 && (
            <ul className="space-y-0.5 text-xs" style={{ color: 'var(--muted)' }}>
              {state.dealStages[id]!.slice(-4).reverse().map((h, i) => (
                <li key={i}>
                  → {config.stages.find((s) => s.key === h.to)?.label ?? h.to} · {h.by?.name ?? 'unknown'} ·{' '}
                  {formatDateTime(h.ts)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Scalar fields */}
      {scalarFields.length > 0 && (
        <section className="mb-5 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-1 text-sm">
          {scalarFields.map((f) => (
            <FieldRow key={f.key} def={f} value={String(rec.fields[f.key] ?? '')} onSave={(v) => update(f.key, v)} />
          ))}
        </section>
      )}

      {/* Relations (many-to-many, e.g. a person's organizations) */}
      {def.relations?.map((rel) => (
        <section key={rel.kind} className="mb-5">
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            {rel.label}
          </h3>
          <RelationField entityId={id} targetKind={rel.kind} />
        </section>
      ))}

      {/* Rich fields */}
      {richFields.map((f) => (
        <section key={f.key} className="mb-5">
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            {f.label}
          </h3>
          <RichField value={String(rec.fields[f.key] ?? '')} onSave={(v) => void dispatch({ type: `${rec.kind}.update`, subject: id, data: { [f.key]: v } })} />
        </section>
      ))}

      {/* Tags */}
      <section className="mb-6">
        <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          Tags
        </h3>
        <TagEditor entityId={id} />
      </section>

      {/* Notes & conversations */}
      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Icon name="MessageSquare" size={15} /> Notes &amp; conversations
        </h3>
        <NoteThread targetId={id} />
      </section>
    </div>
  )
}

function FieldRow({ def, value, onSave }: { def: FieldDef; value: string; onSave: (v: string) => void }) {
  return (
    <>
      <div className="py-1.5 font-medium" style={{ color: 'var(--muted)' }}>
        {def.label}
      </div>
      <div className="py-0.5">
        {def.type === 'ref' ? (
          <RefField refKind={def.refKind!} value={value} onSave={onSave} />
        ) : def.type === 'url' && value.trim() ? (
          <UrlField value={value} onSave={onSave} />
        ) : (
          <EditableText value={value} placeholder={def.placeholder} type={def.type as 'text' | 'email' | 'number'} className="-ml-2 text-sm" onSave={onSave} />
        )}
      </div>
    </>
  )
}

function UrlField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  if (editing) return <EditableText value={value} type="url" className="-ml-2 text-sm" onSave={(v) => { onSave(v); setEditing(false) }} />
  const href = value.startsWith('http') ? value : `https://${value}`
  return (
    <span className="inline-flex items-center gap-1.5">
      <a href={href} target="_blank" rel="noreferrer" className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>
        {value}
      </a>
      <button type="button" onClick={() => setEditing(true)} className="opacity-40 hover:opacity-100" title="Edit">
        <Icon name="Pencil" size={12} />
      </button>
    </span>
  )
}
