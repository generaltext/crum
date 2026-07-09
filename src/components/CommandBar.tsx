import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { KIND_LIST, KINDS, titleField, type EntityKind } from '../lib/model'
import { newId } from '../lib/ids'
import { Icon, type IconName } from './Icon'

interface Item {
  key: string
  label: string
  icon: IconName
  sub?: string
  run: () => void
}

export function CommandBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch, config } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [createKind, setCreateKind] = useState<EntityKind | null>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (open) {
      setQ('')
      setCreateKind(null)
      setActive(0)
    }
  }, [open])

  const firstStage = useMemo(
    () => config.stages.find((s) => s.kind === 'open')?.key ?? config.stages[0]?.key ?? 'lead',
    [config],
  )

  async function create(kind: EntityKind, name: string) {
    const clean = name.trim()
    if (!clean) return
    const id = newId(KINDS[kind].prefix)
    const data: Record<string, unknown> = { [titleField(kind)]: clean }
    if (kind === 'deal') data.stage = firstStage
    await dispatch({ type: `${kind}.create`, subject: id, data })
    onClose()
    navigate(`/e/${id}`)
  }

  const items = useMemo<Item[]>(() => {
    if (createKind) return []
    const ql = q.trim().toLowerCase()
    const actions: Item[] = KIND_LIST.map((k) => ({
      key: `new-${k.kind}`,
      label: `New ${k.singular}`,
      icon: k.icon as IconName,
      run: () => {
        setCreateKind(k.kind)
        setActive(0)
      },
    })).filter((a) => ql === '' || a.label.toLowerCase().includes(ql))

    const ents: Item[] =
      ql === ''
        ? []
        : Object.values(state.entities)
            .filter((e) => !e.archived)
            .map((e) => ({ e, title: String(e.fields[titleField(e.kind)] ?? '') }))
            .filter((x) => x.title.toLowerCase().includes(ql))
            .slice(0, 8)
            .map(({ e, title }) => ({
              key: e.id,
              label: title || `Untitled ${KINDS[e.kind].singular}`,
              icon: KINDS[e.kind].icon as IconName,
              sub: KINDS[e.kind].singular,
              run: () => {
                onClose()
                navigate(`/e/${e.id}`)
              },
            }))

    return [...actions, ...ents]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, createKind, state, navigate])

  if (!open) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return onClose()
    if (createKind) {
      if (e.key === 'Enter') {
        e.preventDefault()
        void create(createKind, q)
      }
      if (e.key === 'Backspace' && q === '') setCreateKind(null)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      items[active]?.run()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]" onClick={onClose} style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3" style={{ borderColor: 'var(--border)' }}>
          {createKind ? (
            <span className="my-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <Icon name={KINDS[createKind].icon as IconName} size={13} /> New {KINDS[createKind].singular}
            </span>
          ) : (
            <Icon name="Search" size={16} style={{ color: 'var(--muted)' }} />
          )}
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            placeholder={createKind ? `${KINDS[createKind].singular} name…` : 'Search or create… (try "new person")'}
            className="flex-1 bg-transparent py-3 text-sm outline-none"
          />
          {createKind && (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              Enter to create
            </span>
          )}
        </div>

        {!createKind && (
          <ul className="max-h-80 overflow-auto py-1">
            {items.length === 0 && (
              <li className="px-3 py-3 text-sm" style={{ color: 'var(--muted)' }}>
                No matches. Type a name and pick “New …”.
              </li>
            )}
            {items.map((it, i) => (
              <li key={it.key}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={it.run}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm"
                  style={{ background: i === active ? 'var(--hover)' : 'transparent' }}
                >
                  <Icon name={it.icon} size={16} style={{ color: 'var(--muted)' }} />
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.sub && (
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {it.sub}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
