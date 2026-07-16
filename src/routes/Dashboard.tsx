import { useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { allTags, entitiesOfKind, type EntityRecord } from '../lib/reducer'
import { tagColor } from '../lib/model'
import { formatMoney, relativeTime } from '../lib/format'
import { Avatar, EmptyState } from '../components/common'
import { TagChip } from '../components/TagEditor'
import { Icon } from '../components/Icon'
import { describe } from './ActivityFeed'

const dealValue = (d: EntityRecord) => Number(d.fields.value) || 0
const stageColor = (kind: string) => (kind === 'won' ? '#16a34a' : kind === 'lost' ? '#e11d48' : 'var(--accent)')

function Card({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border ${className}`} style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
      <div className="flex items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-semibold">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-lg border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
      <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
      <div className="mt-1 truncate text-2xl font-semibold tabular-nums" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

export function Dashboard() {
  const { state, config, version } = useStore()
  const navigate = useNavigate()

  const d = useMemo(() => {
    const deals = entitiesOfKind(state, 'deal')
    const people = entitiesOfKind(state, 'person')
    const orgs = entitiesOfKind(state, 'org')

    const firstOpen = config.stages.find((s) => s.kind === 'open')?.key ?? config.stages[0]?.key ?? 'lead'
    const stageOf = (deal: EntityRecord) => {
      const s = String(deal.fields.stage ?? '')
      return config.stages.some((st) => st.key === s) ? s : firstOpen
    }
    const perStage = config.stages.map((stage) => {
      const items = deals.filter((deal) => stageOf(deal) === stage.key)
      return { stage, count: items.length, value: items.reduce((sum, deal) => sum + dealValue(deal), 0) }
    })
    const sumWhere = (kind: string) =>
      perStage.filter((p) => p.stage.kind === kind).reduce((a, p) => ({ count: a.count + p.count, value: a.value + p.value }), { count: 0, value: 0 })

    const open = sumWhere('open')
    const won = sumWhere('won')
    const maxValue = Math.max(1, ...perStage.map((p) => p.value))
    const tags = allTags(state).slice(0, 12)
    const recent = [...state.events].reverse().slice(0, 8)

    return { deals, people, orgs, perStage, open, won, maxValue, tags, recent }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, config])

  const empty = d.deals.length === 0 && d.people.length === 0 && d.orgs.length === 0
  if (empty) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
        <EmptyState
          icon="LayoutDashboard"
          title="Nothing to show yet"
          hint="Add people, organizations, and deals and this overview fills in with your pipeline and activity."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-5 flex items-center gap-3">
        <Icon name="LayoutDashboard" size={20} style={{ color: 'var(--muted)' }} />
        <h1 className="text-xl font-semibold">Overview</h1>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open pipeline" value={`$${formatMoney(d.open.value)}`} sub={`${d.open.count} open ${d.open.count === 1 ? 'deal' : 'deals'}`} />
        <Stat label="Won" value={`$${formatMoney(d.won.value)}`} sub={`${d.won.count} closed`} accent="#16a34a" />
        <Stat label="People" value={String(d.people.length)} sub="contacts" />
        <Stat label="Organizations" value={String(d.orgs.length)} sub={`${d.deals.length} deals total`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Pipeline"
          className="lg:col-span-2"
          action={
            <button type="button" onClick={() => navigate('/deals')} className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'var(--muted)' }}>
              Board <Icon name="ArrowRight" size={12} />
            </button>
          }
        >
          {d.deals.length === 0 ? (
            <p className="py-4 text-sm" style={{ color: 'var(--muted)' }}>
              No deals yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {d.perStage.map(({ stage, count, value }) => (
                <div key={stage.key} className="flex items-center gap-3 text-sm">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: stageColor(stage.kind) }} />
                  <span className="w-28 shrink-0 truncate">{stage.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--hover)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.round((value / d.maxValue) * 100)}%`, background: stageColor(stage.kind), opacity: 0.55, minWidth: value > 0 ? 4 : 0 }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                    {count}
                  </span>
                  <span className="w-20 shrink-0 text-right tabular-nums">{value > 0 ? `$${formatMoney(value)}` : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Tags"
          action={
            <button type="button" onClick={() => navigate('/tags')} className="text-xs hover:underline" style={{ color: 'var(--muted)' }}>
              All
            </button>
          }
        >
          {d.tags.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No tags yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {d.tags.map((t) => (
                <TagChip key={t.label} label={`${t.label} · ${t.count}`} color={tagColor(t.label, config)} onClick={() => navigate(`/tags/${encodeURIComponent(t.label)}`)} />
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Recent activity"
          className="lg:col-span-3"
          action={
            <button type="button" onClick={() => navigate('/activity')} className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'var(--muted)' }}>
              All activity <Icon name="ArrowRight" size={12} />
            </button>
          }
        >
          {d.recent.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Nothing yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {d.recent.map((ev) => (
                <li key={ev.id} className="flex items-start gap-2.5 rounded-md px-1 py-1.5 text-sm">
                  <Avatar actor={ev.actor} size={20} />
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
        </Card>
      </div>
    </div>
  )
}
