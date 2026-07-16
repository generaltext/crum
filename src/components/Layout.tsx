import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../lib/store'
import { KIND_LIST } from '../lib/model'
import { Icon, type IconName } from './Icon'
import { CommandBar } from './CommandBar'

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: 'LayoutDashboard' },
  ...KIND_LIST.map((k) => ({ to: `/${k.route}`, label: k.plural, icon: k.icon as IconName })),
  { to: '/tags', label: 'Tags', icon: 'Tag' },
  { to: '/activity', label: 'Activity', icon: 'Activity' },
]

// The mobile bottom bar shows the four most-used destinations; the rest live behind
// "More" so the bar stays uncrowded and every tap target stays large.
const BOTTOM_PRIMARY = NAV.filter((n) => ['/dashboard', '/people', '/orgs', '/deals'].includes(n.to))
const MORE_ITEMS = NAV.filter((n) => ['/tags', '/activity'].includes(n.to))

const BRAND = (
  <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18} aria-hidden>
    <path d="M2.9 13.7 L4.8 9.7 L9.1 8.5 L13.1 10.7 L13.6 15.5 L9.7 19.4 L4.6 19 Z" />
    <path d="M16.4 5.8 L19.2 4.6 L21.1 6.7 L19.7 8.9 L17 8.3 Z" />
  </svg>
)

export function Layout() {
  const { connected } = useStore()
  const [cmdOpen, setCmdOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-full flex-col md:flex-row" style={{ background: 'var(--bg)' }}>
      {/* Mobile top bar. No safe-area padding: the General Text shell owns the device
          edges (status bar / home indicator), so adding insets here double-counts them. */}
      <header
        className="flex shrink-0 items-center gap-2 border-b px-3 py-2 md:hidden"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          {BRAND}
        </span>
        <span className="text-base font-semibold tracking-tight">Crum</span>
        {!connected && (
          <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--hover)', color: 'var(--muted)' }}>
            Offline
          </span>
        )}
        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-md"
          style={{ color: 'var(--fg)' }}
          aria-label="Search or create"
        >
          <Icon name="Search" size={18} />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside
        className="hidden w-56 shrink-0 flex-col border-r md:flex"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            {BRAND}
          </span>
          <span className="text-lg font-semibold tracking-tight">Crum</span>
        </div>

        <button
          type="button"
          onClick={() => setCmdOpen(true)}
          className="mx-3 mb-2 flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <Icon name="Search" size={14} />
          <span>Search or create</span>
          <kbd className="ml-auto rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--hover)' }}>
            ⌘K
          </kbd>
        </button>

        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium"
              style={({ isActive }) => ({
                background: isActive ? 'var(--accent-soft)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--fg)',
              })}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t px-4 py-3 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          <span
            title={connected ? 'Synced' : 'Offline'}
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: connected ? '#16a34a' : 'var(--muted)' }}
          />
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="flex shrink-0 border-t md:hidden"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        {BOTTOM_PRIMARY.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium"
            style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--muted)' })}
          >
            <Icon name={item.icon} size={21} />
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium"
          style={{ color: 'var(--muted)' }}
        >
          <Icon name="ChevronDown" size={21} />
          More
        </button>
      </nav>

      {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} onSearch={() => { setMoreOpen(false); setCmdOpen(true) }} connected={connected} />}
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}

function MoreSheet({ onClose, onSearch, connected }: { onClose: () => void; onSearch: () => void; connected: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="rounded-t-2xl border-t p-2"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 mt-1 h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
        <button type="button" onClick={onSearch} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm" style={{ color: 'var(--fg)' }}>
          <Icon name="Search" size={18} style={{ color: 'var(--muted)' }} /> Search or create
        </button>
        {MORE_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium"
            style={({ isActive }) => ({ background: isActive ? 'var(--accent-soft)' : 'transparent', color: isActive ? 'var(--accent)' : 'var(--fg)' })}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </NavLink>
        ))}
        <div className="flex items-center gap-2 px-3 pb-1 pt-2 text-xs" style={{ color: 'var(--muted)' }}>
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={{ background: connected ? '#16a34a' : 'var(--muted)' }}
          />
          <span>{connected ? 'Synced' : 'Offline'}</span>
        </div>
      </div>
    </div>
  )
}
