import { describe, expect, it } from 'vitest'
import { serializeEvent, type CrumEvent } from './events'
import {
  applyEvent,
  commentsForNote,
  emptyState,
  entitiesOfKind,
  notesForTarget,
} from './reducer'
import { appendLine, foldTail } from './log'
import { bodyToPlain, mentionToken, mentionedIds, parseBody } from './mentions'

function ev(partial: Partial<CrumEvent> & Pick<CrumEvent, 'type' | 'subject'>): CrumEvent {
  return {
    id: partial.id ?? `evt_${Math.random().toString(36).slice(2)}`,
    ts: partial.ts ?? '2026-07-01T00:00:00.000Z',
    actor: partial.actor ?? { id: 'u1', name: 'Ada' },
    type: partial.type,
    subject: partial.subject,
    ...(partial.data ? { data: partial.data } : {}),
  }
}

describe('mentions', () => {
  it('round-trips a body with a mention', () => {
    const body = `Call ${mentionToken('per_1', 'Ada Lovelace')} about it`
    const segs = parseBody(body)
    expect(segs).toHaveLength(3)
    expect(segs[1]).toEqual({ type: 'mention', id: 'per_1', label: 'Ada Lovelace' })
    expect(bodyToPlain(body)).toBe('Call Ada Lovelace about it')
    expect(mentionedIds(body)).toEqual(['per_1'])
  })

  it('sanitizes labels that would break the token', () => {
    expect(mentionToken('per_1', 'Ada [The] Great')).toBe('@[Ada The Great](per_1)')
  })
})

describe('reducer', () => {
  it('creates, updates (LWW), and materializes an entity', () => {
    const s = emptyState()
    applyEvent(s, ev({ type: 'person.create', subject: 'per_1', data: { name: 'Ada', role: 'Eng' } }))
    applyEvent(s, ev({ type: 'person.update', subject: 'per_1', ts: '2026-07-02T00:00:00Z', data: { role: 'Head of Eng' } }))
    const p = s.entities.per_1!
    expect(p.fields.name).toBe('Ada')
    expect(p.fields.role).toBe('Head of Eng')
    expect(entitiesOfKind(s, 'person')).toHaveLength(1)
  })

  it('is idempotent — applying the same event twice is a no-op', () => {
    const s = emptyState()
    const e = ev({ id: 'evt_x', type: 'org.create', subject: 'org_1', data: { name: 'Acme' } })
    applyEvent(s, e)
    applyEvent(s, e)
    expect(s.events).toHaveLength(1)
    expect(Object.keys(s.entities)).toHaveLength(1)
  })

  it('adds and removes tags', () => {
    const s = emptyState()
    applyEvent(s, ev({ type: 'person.create', subject: 'per_1', data: { name: 'Ada' } }))
    applyEvent(s, ev({ type: 'tag.add', subject: 'per_1', data: { label: 'priority' } }))
    applyEvent(s, ev({ type: 'tag.add', subject: 'per_1', data: { label: 'priority' } })) // dupe
    expect(s.entities.per_1!.tags).toEqual(['priority'])
    applyEvent(s, ev({ type: 'tag.remove', subject: 'per_1', data: { label: 'priority' } }))
    expect(s.entities.per_1!.tags).toEqual([])
  })

  it('attaches notes and comments (NOTE 1: unified conversation)', () => {
    const s = emptyState()
    applyEvent(s, ev({ type: 'person.create', subject: 'per_1', data: { name: 'Ada' } }))
    applyEvent(s, ev({ type: 'note.create', subject: 'note_1', data: { target: 'per_1', body: 'Kickoff' } }))
    applyEvent(s, ev({ type: 'comment.create', subject: 'cmt_1', data: { note: 'note_1', body: 'Reply' } }))
    expect(notesForTarget(s, 'per_1')).toHaveLength(1)
    expect(commentsForNote(s, 'note_1')).toHaveLength(1)
    expect(commentsForNote(s, 'note_1')[0]!.body).toBe('Reply')
  })

  it('tracks deal stage changes with history', () => {
    const s = emptyState()
    applyEvent(s, ev({ type: 'deal.create', subject: 'deal_1', data: { title: 'D', stage: 'lead' } }))
    applyEvent(s, ev({ type: 'deal.stage_change', subject: 'deal_1', data: { from: 'lead', to: 'proposal' } }))
    expect(s.entities.deal_1!.fields.stage).toBe('proposal')
    expect(s.dealStages.deal_1).toHaveLength(1)
    expect(s.dealStages.deal_1![0]!.to).toBe('proposal')
  })
})

describe('log fold', () => {
  it('folds incrementally and skips a half-synced trailing line', () => {
    const s = emptyState()
    const e1 = serializeEvent(ev({ id: 'e1', type: 'org.create', subject: 'org_1', data: { name: 'Acme' } }))
    const e2 = serializeEvent(ev({ id: 'e2', type: 'org.create', subject: 'org_2', data: { name: 'Northwind' } }))

    // First shard content: one complete line + a partial (no trailing newline).
    const partial = appendLine('', e1) + e2 // e1\n + e2 (no newline)
    const len1 = foldTail(s, partial, 0)
    expect(Object.keys(s.entities)).toEqual(['org_1']) // partial e2 not applied yet
    expect(len1).toBe(appendLine('', e1).length)

    // e2 completes; only the new tail is parsed, e1 is not re-applied.
    const full = appendLine(appendLine('', e1), e2)
    const len2 = foldTail(s, full, len1)
    expect(Object.keys(s.entities).sort()).toEqual(['org_1', 'org_2'])
    expect(len2).toBe(full.length)
    expect(s.events).toHaveLength(2) // no duplicates
  })

  it('appendLine keeps the log newline-terminated', () => {
    expect(appendLine('', '{"a":1}')).toBe('{"a":1}\n')
    expect(appendLine('{"a":1}\n', '{"b":2}')).toBe('{"a":1}\n{"b":2}\n')
  })
})
