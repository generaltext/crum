import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { entitiesOfKind, type EntityRecord } from '../lib/reducer'
import { KINDS, tagColor, titleField, type EntityKind } from '../lib/model'
import { bodyToPlain } from '../lib/mentions'
import { formatMoney, relativeTime } from '../lib/format'
import { useCreateEntity } from '../components/useCreate'
import { Avatar, Button, EmptyState } from '../components/common'
import { TagChip } from '../components/TagEditor'
import { Icon, type IconName } from '../components/Icon'

function subtitle(rec: EntityRecord, resolve: (id: string) => string): string {
  const f = rec.fields
  switch (rec.kind) {
    case 'person':
      return [f.role, f.org ? resolve(String(f.org)) : ''].filter(Boolean).join(' · ')
    case 'org':
      return [f.location, f.website].filter(Boolean).join(' · ')
    case 'opp':
      return bodyToPlain(String(f.description ?? '')).slice(0, 120)
    case 'deal':
      return [f.value ? `$${formatMoney(Number(f.value))}` : '', f.org ? resolve(String(f.org)) : '']
        .filter(Boolean)
        .join(' · ')
  }
}

export function EntityListPage({ kind }: { kind: EntityKind }) {
  const { state, config } = useStore()
  const navigate = useNavigate()
  const create = useCreateEntity()
  const def = KINDS[kind]
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const resolve = (id: string) => String(state.entities[id]?.fields[titleField(state.entities[id]!.kind)] ?? '')

  const withArchived = entitiesOfKind(state, kind, true)
  const all = withArchived.filter((e) => !e.archived)
  const archivedCount = withArchived.length - all.length
  const source = showArchived ? withArchived : all
  const q = query.trim().toLowerCase()
  const rows = q
    ? source.filter((r) => {
        const title = String(r.fields[titleField(kind)] ?? '').toLowerCase()
        return title.includes(q) || r.tags.some((t) => t.toLowerCase().includes(q))
      })
    : source

  const submitCreate = async () => {
    if (!name.trim()) return setCreating(false)
    await create(kind, name)
    setName('')
    setCreating(false)
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <header className="mb-5 flex items-center gap-3">
        <Icon name={def.icon as IconName} size={20} style={{ color: 'var(--muted)' }} />
        <h1 className="text-xl font-semibold">{def.plural}</h1>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {all.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs hover:bg-[var(--hover)]"
              style={{ color: showArchived ? 'var(--accent)' : 'var(--muted)' }}
            >
              <Icon name="Archive" size={13} /> {showArchived ? 'Hide' : 'Show'} archived ({archivedCount})
            </button>
          )}
          <div className="relative">
            <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter…"
              className="w-44 rounded-md border py-1.5 pl-8 pr-2 text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
            />
          </div>
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Icon name="Plus" size={15} /> New
          </Button>
        </div>
      </header>

      {creating && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <Icon name={def.icon as IconName} size={16} style={{ color: 'var(--muted)' }} />
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submitCreate()
              if (e.key === 'Escape') setCreating(false)
            }}
            onBlur={() => void submitCreate()}
            placeholder={def.fields.find((f) => f.title)?.placeholder ?? `New ${def.singular}`}
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Enter to create
          </span>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={def.icon as IconName}
          title={all.length === 0 ? `No ${def.plural.toLowerCase()} yet` : 'No matches'}
          hint={all.length === 0 ? `Create your first ${def.singular.toLowerCase()} to get started.` : undefined}
          action={
            all.length === 0 ? (
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Icon name="Plus" size={15} /> New {def.singular}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="rowlist">
          {rows.map((r) => {
            const title = String(r.fields[titleField(kind)] ?? '') || `Untitled ${def.singular}`
            const sub = subtitle(r, resolve)
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/e/${r.id}`)}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm hover:bg-[var(--hover)]"
                  style={r.archived ? { opacity: 0.6 } : undefined}
                >
                  <span className="max-w-[46%] flex-none truncate font-medium">{title}</span>
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                    {r.archived && <span className="badge-archived">Archived</span>}
                    {r.tags.map((t) => (
                      <TagChip key={t} label={t} color={tagColor(t, config)} />
                    ))}
                    {sub && (
                      <span className="truncate text-[13px]" style={{ color: 'var(--muted)' }}>
                        {sub}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                    {relativeTime(r.updatedAt)}
                  </span>
                  <Avatar actor={r.updatedBy} size={18} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
