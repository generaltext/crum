// Loading skeleton shaped like the real app chrome (sidebar + list view), shown
// while the store hydrates. Uses --hover as a theme-adaptive placeholder fill so
// it reads the same in light and dark.

function Bar({ w, h = 12, className = '', style }: { w: number | string; h?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ width: typeof w === 'number' ? `${w}px` : w, height: h, background: 'var(--hover)', ...style }}
    />
  )
}

export function AppSkeleton() {
  return (
    <div className="flex h-full" style={{ background: 'var(--bg)' }} aria-hidden>
      <aside
        className="flex w-56 shrink-0 flex-col border-r"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="h-7 w-7 rounded-md" style={{ background: 'var(--accent-soft)' }} />
          <span className="text-lg font-semibold tracking-tight">Crum</span>
        </div>
        <div className="mx-3 mb-2 h-8 rounded-md border" style={{ borderColor: 'var(--border)' }} />
        <nav className="flex-1 space-y-1 px-2 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-2.5 py-1.5">
              <Bar w={16} h={16} />
              <Bar w={72 - (i % 3) * 12} h={12} />
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-2 border-t px-4 py-3" style={{ borderColor: 'var(--border)' }}>
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--muted)' }} />
          <Bar w={64} h={10} />
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <header className="mb-5 flex items-center gap-3">
            <Bar w={20} h={20} />
            <Bar w={120} h={22} />
          </header>
          <div className="rowlist">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-[7px]">
                <Bar w={140 + (i % 3) * 30} h={13} />
                <Bar w={90 - (i % 4) * 12} h={11} style={{ opacity: 0.6 }} />
                <div className="ml-auto flex items-center gap-2.5">
                  <Bar w={36} h={11} style={{ opacity: 0.6 }} />
                  <span className="h-[18px] w-[18px] animate-pulse rounded-full" style={{ background: 'var(--hover)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
