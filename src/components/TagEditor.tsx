import { useState } from 'react'
import { useStore } from '../lib/store'
import { allTags } from '../lib/reducer'
import { tagColor } from '../lib/model'
import { Icon } from './Icon'

export function TagChip({
  label,
  color,
  onRemove,
  onClick,
}: {
  label: string
  color: string
  onRemove?: () => void
  onClick?: () => void
}) {
  return (
    <span className={`tag tag-${color}`}>
      <button type="button" onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
        {label}
      </button>
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100" aria-label={`Remove ${label}`}>
          <Icon name="X" size={11} />
        </button>
      )}
    </span>
  )
}

export function TagEditor({ entityId }: { entityId: string }) {
  const { state, config, dispatch } = useStore()
  const [adding, setAdding] = useState(false)
  const [input, setInput] = useState('')
  const rec = state.entities[entityId]
  if (!rec) return null

  const add = (label: string) => {
    const clean = label.trim()
    if (clean && !rec.tags.includes(clean)) void dispatch({ type: 'tag.add', subject: entityId, data: { label: clean } })
    setInput('')
    setAdding(false)
  }

  const suggestions = allTags(state)
    .map((t) => t.label)
    .filter((l) => !rec.tags.includes(l) && (input === '' || l.toLowerCase().includes(input.toLowerCase())))
    .slice(0, 5)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {rec.tags.map((t) => (
        <TagChip
          key={t}
          label={t}
          color={tagColor(t, config)}
          onRemove={() => void dispatch({ type: 'tag.remove', subject: entityId, data: { label: t } })}
        />
      ))}
      {adding ? (
        <span className="relative">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add(input)
              if (e.key === 'Escape') setAdding(false)
            }}
            onBlur={() => setTimeout(() => setAdding(false), 150)}
            placeholder="tag…"
            className="w-24 rounded-md border px-2 py-0.5 text-xs outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
          />
          {suggestions.length > 0 && (
            <ul
              className="absolute left-0 top-full z-40 mt-1 w-40 overflow-hidden rounded-md border py-1 shadow-lg"
              style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
            >
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      add(s)
                    }}
                    className="block w-full px-2 py-1 text-left text-xs hover:bg-[var(--hover)]"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="tag"
          style={{ cursor: 'pointer' }}
        >
          <Icon name="Plus" size={11} /> tag
        </button>
      )}
    </div>
  )
}
