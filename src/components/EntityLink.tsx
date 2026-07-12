import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { KINDS, kindOfId, titleField } from '../lib/model'
import { Icon } from './Icon'
import type { IconName } from './Icon'

export function useEntityTitle(id: string, fallback = ''): string {
  const { state } = useStore()
  const rec = state.entities[id]
  if (!rec) return fallback || 'Unknown'
  const t = rec.fields[titleField(rec.kind)]
  return (typeof t === 'string' && t.trim()) || fallback || `Untitled ${KINDS[rec.kind].singular}`
}

/** Inline link to an entity, used for mention chips and reference fields. */
export function EntityLink({ id, label, showIcon = false }: { id: string; label?: string; showIcon?: boolean }) {
  const navigate = useNavigate()
  const title = useEntityTitle(id, label ?? '')
  const kind = kindOfId(id)
  const icon = kind ? (KINDS[kind].icon as IconName) : 'Circle'
  return (
    <span
      className="mention"
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/e/${id}`)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/e/${id}`)
      }}
    >
      {showIcon && <Icon name={icon} size={12} className="mb-0.5 inline" />} {title}
    </span>
  )
}
