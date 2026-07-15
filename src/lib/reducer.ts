// The projection: fold the event log into current-state records. Application is
// idempotent (each event id applied at most once) so re-folding a shard tail, or
// seeing our own optimistic write echoed back by the watch, is always safe.
//
// Field conflicts resolve last-writer-wins by (ts, id). Because we apply events
// in log order and appends are monotonic, later events simply overwrite earlier
// ones; on a full rebuild we sort by (ts, id) first to make that deterministic.

import type { Actor, CrumEvent } from './events'
import type { EntityKind } from './model'
import { kindOfId } from './model'

export interface EntityRecord {
  id: string
  kind: EntityKind
  fields: Record<string, string | number>
  tags: string[]
  links: string[]
  archived: boolean
  createdBy: Actor | null
  createdAt: string
  updatedBy: Actor | null
  updatedAt: string
}

export interface NoteRecord {
  id: string
  target: string
  body: string
  archived: boolean
  createdBy: Actor | null
  createdAt: string
  updatedBy: Actor | null
  updatedAt: string
}

export interface CommentRecord {
  id: string
  note: string
  body: string
  archived: boolean
  createdBy: Actor | null
  createdAt: string
}

export interface StageEntry {
  ts: string
  from: string | null
  to: string
  by: Actor | null
}

export interface State {
  entities: Record<string, EntityRecord>
  notes: Record<string, NoteRecord>
  comments: Record<string, CommentRecord>
  dealStages: Record<string, StageEntry[]>
  /** every applied event, in application order, for the activity feed */
  events: CrumEvent[]
  applied: Set<string>
}

export function emptyState(): State {
  return {
    entities: {},
    notes: {},
    comments: {},
    dealStages: {},
    events: [],
    applied: new Set(),
  }
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export function applyEvent(state: State, ev: CrumEvent): void {
  if (state.applied.has(ev.id)) return
  state.applied.add(ev.id)
  state.events.push(ev)

  const [entity, verb] = ev.type.split('.')
  const data = ev.data ?? {}

  switch (entity) {
    case 'org':
    case 'person':
    case 'deal':
      applyEntity(state, ev, verb ?? '', data)
      break
    case 'note':
      applyNote(state, ev, verb ?? '', data)
      break
    case 'comment':
      applyComment(state, ev, verb ?? '', data)
      break
    case 'tag':
      applyTag(state, ev, verb ?? '', data)
      break
    case 'link':
      applyLink(state, ev, verb ?? '', data)
      break
    default:
      // Unknown event type from a newer build: recorded in events (activity),
      // otherwise ignored. Forward-compatible by design.
      break
  }
}

function applyEntity(state: State, ev: CrumEvent, verb: string, data: Record<string, unknown>): void {
  const kind = kindOfId(ev.subject)
  if (!kind) return

  if (verb === 'create') {
    if (state.entities[ev.subject]) return
    state.entities[ev.subject] = {
      id: ev.subject,
      kind,
      fields: fieldsFrom(data),
      tags: [],
      links: [],
      archived: false,
      createdBy: ev.actor,
      createdAt: ev.ts,
      updatedBy: ev.actor,
      updatedAt: ev.ts,
    }
    return
  }

  const rec = state.entities[ev.subject]
  if (!rec) return

  if (verb === 'update') {
    Object.assign(rec.fields, fieldsFrom(data))
    touch(rec, ev)
  } else if (verb === 'archive') {
    rec.archived = true
    touch(rec, ev)
  } else if (verb === 'restore') {
    rec.archived = false
    touch(rec, ev)
  } else if (verb === 'stage_change') {
    const to = asString(data.to)
    if (!to) return
    rec.fields.stage = to
    ;(state.dealStages[ev.subject] ??= []).push({
      ts: ev.ts,
      from: data.from == null ? null : asString(data.from),
      to,
      by: ev.actor,
    })
    touch(rec, ev)
  }
}

function fieldsFrom(data: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'string' || typeof v === 'number') out[k] = v
  }
  return out
}

function touch(rec: EntityRecord | NoteRecord, ev: CrumEvent): void {
  rec.updatedAt = ev.ts
  rec.updatedBy = ev.actor
}

function applyNote(state: State, ev: CrumEvent, verb: string, data: Record<string, unknown>): void {
  if (verb === 'create') {
    if (state.notes[ev.subject]) return
    state.notes[ev.subject] = {
      id: ev.subject,
      target: asString(data.target),
      body: asString(data.body),
      archived: false,
      createdBy: ev.actor,
      createdAt: ev.ts,
      updatedBy: ev.actor,
      updatedAt: ev.ts,
    }
    return
  }
  const rec = state.notes[ev.subject]
  if (!rec) return
  if (verb === 'update') {
    if (typeof data.body === 'string') rec.body = data.body
    touch(rec, ev)
  } else if (verb === 'archive') {
    rec.archived = true
    touch(rec, ev)
  } else if (verb === 'restore') {
    rec.archived = false
    touch(rec, ev)
  }
}

function applyComment(state: State, ev: CrumEvent, verb: string, data: Record<string, unknown>): void {
  if (verb === 'create') {
    if (state.comments[ev.subject]) return
    state.comments[ev.subject] = {
      id: ev.subject,
      note: asString(data.note),
      body: asString(data.body),
      archived: false,
      createdBy: ev.actor,
      createdAt: ev.ts,
    }
    return
  }
  const rec = state.comments[ev.subject]
  if (!rec) return
  if (verb === 'update') {
    if (typeof data.body === 'string') rec.body = data.body
  } else if (verb === 'archive') {
    rec.archived = true
  }
}

function applyTag(state: State, ev: CrumEvent, verb: string, data: Record<string, unknown>): void {
  const rec = state.entities[ev.subject]
  if (!rec) return
  const label = asString(data.label).trim()
  if (!label) return
  if (verb === 'add') {
    if (!rec.tags.includes(label)) {
      rec.tags.push(label)
      rec.tags.sort()
    }
  } else if (verb === 'remove') {
    rec.tags = rec.tags.filter((t) => t !== label)
  }
}

function applyLink(state: State, ev: CrumEvent, verb: string, data: Record<string, unknown>): void {
  const from = state.entities[ev.subject]
  const toId = asString(data.to)
  const to = state.entities[toId]
  if (!from || !to) return
  if (verb === 'add') {
    if (!from.links.includes(toId)) from.links.push(toId)
    if (!to.links.includes(from.id)) to.links.push(from.id)
  } else if (verb === 'remove') {
    from.links = from.links.filter((l) => l !== toId)
    to.links = to.links.filter((l) => l !== from.id)
  }
}

// ── selectors ────────────────────────────────────────────────────────────────

export function entitiesOfKind(state: State, kind: EntityKind, includeArchived = false): EntityRecord[] {
  return Object.values(state.entities)
    .filter((e) => e.kind === kind && (includeArchived || !e.archived))
    .sort((a, b) => (b.updatedAt < a.updatedAt ? -1 : 1))
}

export function linkedOfKind(
  state: State,
  entityId: string,
  kind: EntityKind,
  includeArchived = false,
): EntityRecord[] {
  const rec = state.entities[entityId]
  if (!rec) return []
  return rec.links
    .map((id) => state.entities[id])
    .filter((e): e is EntityRecord => !!e && e.kind === kind && (includeArchived || !e.archived))
    .sort((a, b) => (b.updatedAt < a.updatedAt ? -1 : 1))
}

export function notesForTarget(state: State, targetId: string, includeArchived = false): NoteRecord[] {
  return Object.values(state.notes)
    .filter((n) => n.target === targetId && (includeArchived || !n.archived))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)) // newest first
}

export function commentsForNote(state: State, noteId: string): CommentRecord[] {
  return Object.values(state.comments)
    .filter((c) => c.note === noteId && !c.archived)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)) // oldest first (thread order)
}

export function allTags(state: State): { label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const e of Object.values(state.entities)) {
    if (e.archived) continue
    for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function entitiesWithTag(state: State, label: string): EntityRecord[] {
  return Object.values(state.entities)
    .filter((e) => !e.archived && e.tags.includes(label))
    .sort((a, b) => (b.updatedAt < a.updatedAt ? -1 : 1))
}
