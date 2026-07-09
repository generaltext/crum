import { parseBody } from '../lib/mentions'
import { EntityLink } from './EntityLink'

/** Render a stored rich-text body: newlines preserved, mentions as live links. */
export function MentionText({ body, className = '' }: { body: string; className?: string }) {
  if (!body.trim()) return null
  const segments = parseBody(body)
  return (
    <div className={`whitespace-pre-wrap break-words leading-relaxed ${className}`}>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <EntityLink key={i} id={seg.id} label={seg.label} />
        ),
      )}
    </div>
  )
}
