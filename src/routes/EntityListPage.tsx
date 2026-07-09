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

  const resolve = (id: string) => String(state.entities[id]?.fields[titleField(state.entities[id]!.kind)] ?? '')

  const all = entitiesOfKind(state, kind)
  const q = query.trim().toLowerCase()
  const rows = q
    ? all.filter((r) => {
        const title = String(r.fields[titleField(kind)] ?? '').toLowerCase()
        return title.includes(q) || r.tags.some((t) => t.toLowerCase().includes(q))
      })
    : all

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
        <ul className="divide-y overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          {rows.map((r) => {
            const title = String(r.fields[titleField(kind)] ?? '') || `Untitled ${def.singular}`
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/e/${r.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--hover)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{title}</span>
                      {r.tags.map((t) => (
                        <TagChip key={t} label={t} color={tagColor(t, config)} />
                      ))}
                    </div>
                    {subtitle(r, resolve) && (
                      <div className="truncate text-sm" style={{ color: 'var(--muted)' }}>
                        {subtitle(r, resolve)}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-xs" style={{ color: 'var(--muted)' }}>
                    {relativeTime(r.updatedAt)}
                  </span>
                  <Avatar actor={r.updatedBy} size={20} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
