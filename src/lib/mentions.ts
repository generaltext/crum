// Rich text is stored as a portable plaintext string with inline mention
// tokens: `@[Label](entityId)`. The label is a snapshot (so a deleted entity
// still reads sensibly) and the id is the durable link. This keeps every
// description/note/comment greppable and readable outside CRUM while still
// letting the app render live links and resolve the current name.

export interface TextSegment {
  type: 'text'
  text: string
}
export interface MentionSegment {
  type: 'mention'
  id: string
  label: string
}
export type Segment = TextSegment | MentionSegment

const MENTION_RE = /@\[([^\]\n]+)\]\(([a-z]+_[0-9A-Za-z]+)\)/g

export function parseBody(body: string): Segment[] {
  const segments: Segment[] = []
  let last = 0
  MENTION_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = MENTION_RE.exec(body)) !== null) {
    if (m.index > last) segments.push({ type: 'text', text: body.slice(last, m.index) })
    segments.push({ type: 'mention', label: m[1]!, id: m[2]! })
    last = m.index + m[0].length
  }
  if (last < body.length) segments.push({ type: 'text', text: body.slice(last) })
  return segments
}

export function mentionToken(id: string, label: string): string {
  // strip characters that would break the token syntax, collapse whitespace
  const clean = label.replace(/[[\]\n]/g, ' ').replace(/\s+/g, ' ').trim() || id
  return `@[${clean}](${id})`
}

/** All entity ids referenced by a body — for backlinks / "mentioned in". */
export function mentionedIds(body: string): string[] {
  const ids: string[] = []
  for (const seg of parseBody(body)) if (seg.type === 'mention') ids.push(seg.id)
  return ids
}

/** Plain text with mentions flattened to their labels (for search / previews). */
export function bodyToPlain(body: string): string {
  return parseBody(body)
    .map((s) => (s.type === 'text' ? s.text : s.label))
    .join('')
}
