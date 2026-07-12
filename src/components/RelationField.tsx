import { useState } from 'react'
import { useStore } from '../lib/store'
import { entitiesOfKind, linkedOfKind } from '../lib/reducer'
import { KINDS, titleField, type EntityKind } from '../lib/model'
import { newId } from '../lib/ids'
import { EntityLink } from './EntityLink'
import { Icon, type IconName } from './Icon'

/** Edit a many-to-many relationship (backed by bidirectional links): list the
 *  linked entities of a kind, add an existing one, or create-and-link a new one. */
export function RelationField({ entityId, targetKind }: { entityId: string; targetKind: EntityKind }) {
  const { state, dispatch } = useStore()
  const [adding, setAdding] = useState(false)
  const [q, setQ] = useState('')
  const def = KINDS[targetKind]
  const rec = state.entities[entityId]
  if (!rec) return null

  const linked = linkedOfKind(state, entityId, targetKind)
  const ql = q.trim().toLowerCase()
  const exact = entitiesOfKind(state, targetKind).some(
    (e) => String(e.fields[titleField(targetKind)] ?? '').toLowerCase() === ql,
  )
  const candidates = entitiesOfKind(state, targetKind)
    .filter((e) => !rec.links.includes(e.id))
    .filter((e) => ql === '' || String(e.fields[titleField(targetKind)] ?? '').toLowerCase().includes(ql))
    .slice(0, 6)

  const reset = () => {
    setQ('')
    setAdding(false)
  }
  const link = (toId: string) => {
    void dispatch({ type: 'link.add', subject: entityId, data: { to: toId } })
    reset()
  }
  const createAndLink = () => {
    const name = q.trim()
    if (!name) return
    const id = newId(def.prefix)
    void dispatch([
      { type: `${targetKind}.create`, subject: id, data: { [titleField(targetKind)]: name } },
      { type: 'link.add', subject: entityId, data: { to: id } },
    ])
    reset()
  }

  return (
    <div className="space-y-1.5">
      {linked.length > 0 && (
        <ul className="rowlist">
          {linked.map((e) => (
            <li key={e.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
              <Icon name={def.icon as IconName} size={14} style={{ color: 'var(--muted)' }} />
              <EntityLink id={e.id} label={String(e.fields[titleField(targetKind)] ?? '')} />
              {typeof e.fields.role === 'string' && e.fields.role && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {e.fields.role}
                </span>
              )}
              <button
                type="button"
                onClick={() => void dispatch({ type: 'link.remove', subject: entityId, data: { to: e.id } })}
                className="ml-auto opacity-40 hover:opacity-100"
                aria-label={`Remove ${String(e.fields[titleField(targetKind)] ?? '')}`}
                title="Remove"
              >
                <Icon name="X" size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="relative">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') reset()
              if (e.key === 'Enter') {
                if (candidates[0]) link(candidates[0].id)
                else if (q.trim() && !exact) createAndLink()
              }
            }}
            onBlur={() => setTimeout(reset, 150)}
            placeholder={`Add ${def.singular.toLowerCase()}…`}
            className="w-56 rounded-md border px-2.5 py-1.5 text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
          />
          {(candidates.length > 0 || (q.trim() && !exact)) && (
            <ul
              className="absolute left-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-md border py-1 shadow-lg"
              style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
            >
              {candidates.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onMouseDown={(ev) => {
                      ev.preventDefault()
                      link(e.id)
                    }}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-[var(--hover)]"
                  >
                    <Icon name={def.icon as IconName} size={14} style={{ color: 'var(--muted)' }} />
                    <span className="truncate">{String(e.fields[titleField(targetKind)] ?? '') || 'Untitled'}</span>
                  </button>
                </li>
              ))}
              {q.trim() && !exact && (
                <li>
                  <button
                    type="button"
                    onMouseDown={(ev) => {
                      ev.preventDefault()
                      createAndLink()
                    }}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm hover:bg-[var(--hover)]"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Icon name="Plus" size={14} /> Create “{q.trim()}”
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <Icon name="Plus" size={13} /> Add {def.singular.toLowerCase()}
        </button>
      )}
    </div>
  )
}
