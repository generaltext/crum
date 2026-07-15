import { useStore } from '../lib/store'
import type { CrumEvent } from '../lib/events'
import type { State } from '../lib/reducer'
import { KINDS, kindOfId } from '../lib/model'
import { relativeTime } from '../lib/format'
import { Avatar, EmptyState } from '../components/common'
import { EntityLink } from '../components/EntityLink'
import { Icon } from '../components/Icon'
import type { ReactNode } from 'react'

function verbFor(singular: string): Record<string, string> {
  return {
    create: `created ${singular.toLowerCase()}`,
    update: `updated ${singular.toLowerCase()}`,
    archive: `archived ${singular.toLowerCase()}`,
    restore: `restored ${singular.toLowerCase()}`,
  }
}

export function describe(ev: CrumEvent, state: State): ReactNode {
  const [entity, verb] = ev.type.split('.')
  const kind = kindOfId(ev.subject)

  if (kind && (entity === 'org' || entity === 'person' || entity === 'deal')) {
    const sing = KINDS[kind].singular
    if (verb === 'stage_change') {
      return (
        <>
          moved <EntityLink id={ev.subject} /> to <b>{String(ev.data?.to ?? '')}</b>
        </>
      )
    }
    const phrase = verbFor(sing)[verb ?? ''] ?? `${verb} ${sing.toLowerCase()}`
    return (
      <>
        {phrase} <EntityLink id={ev.subject} />
      </>
    )
  }

  if (entity === 'note') {
    const target = state.notes[ev.subject]?.target ?? String(ev.data?.target ?? '')
    return verb === 'create' ? <>added a note on {target ? <EntityLink id={target} /> : 'a record'}</> : <>updated a note</>
  }
  if (entity === 'comment') {
    const noteId = state.comments[ev.subject]?.note ?? String(ev.data?.note ?? '')
    const target = noteId ? state.notes[noteId]?.target : undefined
    return <>replied on {target ? <EntityLink id={target} /> : 'a note'}</>
  }
  if (entity === 'tag') {
    return (
      <>
        {verb === 'add' ? 'tagged' : 'untagged'} <EntityLink id={ev.subject} /> <b>#{String(ev.data?.label ?? '')}</b>
      </>
    )
  }
  if (entity === 'link') {
    return (
      <>
        linked <EntityLink id={ev.subject} /> ↔ <EntityLink id={String(ev.data?.to ?? '')} />
      </>
    )
  }
  return <>{ev.type}</>
}

export function ActivityFeed() {
  const { state } = useStore()
  const events = [...state.events].reverse().slice(0, 200)

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <header className="mb-5 flex items-center gap-3">
        <Icon name="Activity" size={20} style={{ color: 'var(--muted)' }} />
        <h1 className="text-xl font-semibold">Activity</h1>
      </header>

      {events.length === 0 ? (
        <EmptyState icon="Activity" title="Nothing yet" hint="Every change shows up here, stamped with who made it." />
      ) : (
        <ul className="space-y-1">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-start gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-[var(--hover)]">
              <Avatar actor={ev.actor} size={22} />
              <div className="min-w-0 flex-1 leading-snug">
                <span className="font-medium">{ev.actor?.name ?? 'unknown'}</span> {describe(ev, state)}
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {relativeTime(ev.ts)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
