import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { entitiesOfKind, type EntityRecord } from '../lib/reducer'
import { titleField, type Stage } from '../lib/model'
import { formatMoney } from '../lib/format'
import { useCreateEntity } from '../components/useCreate'
import { Button } from '../components/common'
import { Icon } from '../components/Icon'

export function DealsBoard() {
  const { state, config } = useStore()
  const navigate = useNavigate()
  const create = useCreateEntity()
  const { dispatch } = useStore()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const deals = entitiesOfKind(state, 'deal')
  const archivedDeals = entitiesOfKind(state, 'deal', true).filter((d) => d.archived)
  const firstStage = config.stages.find((s) => s.kind === 'open')?.key ?? config.stages[0]?.key ?? 'lead'
  const stageOf = (d: EntityRecord) => {
    const s = String(d.fields.stage ?? '')
    return config.stages.some((st) => st.key === s) ? s : firstStage
  }
  const resolve = (id: string) => String(state.entities[id]?.fields[titleField(state.entities[id]!.kind)] ?? '')

  const move = (dealId: string, to: string) => {
    const d = state.entities[dealId]
    if (!d) return
    const from = stageOf(d)
    if (from === to) return
    void dispatch({ type: 'deal.stage_change', subject: dealId, data: { from, to } })
  }

  const total = (stage: Stage) =>
    deals.filter((d) => stageOf(d) === stage.key).reduce((sum, d) => sum + (Number(d.fields.value) || 0), 0)

  return (
    <div className="flex h-full flex-col px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <Icon name="Handshake" size={20} style={{ color: 'var(--muted)' }} />
        <h1 className="text-xl font-semibold">Deals</h1>
        <span className="text-sm" style={{ color: 'var(--muted)' }}>
          {deals.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {archivedDeals.length > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs hover:bg-[var(--hover)]"
              style={{ color: showArchived ? 'var(--accent)' : 'var(--muted)' }}
            >
              <Icon name="Archive" size={13} /> {showArchived ? 'Hide' : 'Show'} archived ({archivedDeals.length})
            </button>
          )}
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Icon name="Plus" size={15} /> New deal
          </Button>
        </div>
      </header>

      {creating && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
          <Icon name="Handshake" size={16} style={{ color: 'var(--muted)' }} />
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                void create('deal', name)
                setName('')
                setCreating(false)
              }
              if (e.key === 'Escape') setCreating(false)
            }}
            onBlur={() => setCreating(false)}
            placeholder="Deal name"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Enter to create
          </span>
        </div>
      )}

      <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
        {config.stages.map((stage) => {
          const col = deals.filter((d) => stageOf(d) === stage.key)
          return (
            <div
              key={stage.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) move(dragId, stage.key)
                setDragId(null)
              }}
              className="flex w-64 shrink-0 flex-col rounded-lg border"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
            >
              <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background:
                      stage.kind === 'won' ? '#16a34a' : stage.kind === 'lost' ? '#e11d48' : 'var(--accent)',
                  }}
                />
                <span className="text-sm font-medium">{stage.label}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>
                  {col.length}
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-2">
                {total(stage) > 0 && (
                  <div className="px-1 text-xs" style={{ color: 'var(--muted)' }}>
                    ${formatMoney(total(stage))}
                  </div>
                )}
                {col.map((d) => (
                  <div
                    key={d.id}
                    draggable
                    onDragStart={() => setDragId(d.id)}
                    onClick={() => navigate(`/e/${d.id}`)}
                    className="cursor-pointer rounded-md border p-2.5 shadow-sm hover:border-[var(--accent)]"
                    style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
                  >
                    <div className="truncate text-sm font-medium">
                      {String(d.fields.title ?? '') || 'Untitled deal'}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs" style={{ color: 'var(--muted)' }}>
                      <span className="truncate">{d.fields.org ? resolve(String(d.fields.org)) : ''}</span>
                      {d.fields.value ? <span>${formatMoney(Number(d.fields.value))}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {showArchived && archivedDeals.length > 0 && (
          <div
            className="flex w-64 shrink-0 flex-col rounded-lg border border-dashed"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
          >
            <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--border)' }}>
              <Icon name="Archive" size={13} style={{ color: 'var(--muted)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                Archived
              </span>
              <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>
                {archivedDeals.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-2">
              {archivedDeals.map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/e/${d.id}`)}
                  className="cursor-pointer rounded-md border p-2.5"
                  style={{ borderColor: 'var(--border)', background: 'var(--panel)', opacity: 0.65 }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">
                      {String(d.fields.title ?? '') || 'Untitled deal'}
                    </span>
                    <span className="badge-archived ml-auto">Archived</span>
                  </div>
                  <div className="mt-1 truncate text-xs" style={{ color: 'var(--muted)' }}>
                    {d.fields.org ? resolve(String(d.fields.org)) : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
