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
  ...KIND_LIST.map((k) => ({ to: `/${k.route}`, label: k.plural, icon: k.icon as IconName })),
  { to: '/tags', label: 'Tags', icon: 'Tag' },
  { to: '/activity', label: 'Activity', icon: 'Activity' },
]

export function Layout() {
  const { connected, me } = useStore()
  const [cmdOpen, setCmdOpen] = useState(false)

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
    <div className="flex h-full" style={{ background: 'var(--bg)' }}>
      <aside
        className="flex w-56 shrink-0 flex-col border-r"
        style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}
      >
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Icon name="Users" size={16} />
          </span>
          <span className="text-lg font-semibold tracking-tight">CRUM</span>
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
          <Icon name={connected ? 'Wifi' : 'WifiOff'} size={13} />
          <span>{connected ? 'Synced' : 'Offline'}</span>
          {me && <span className="ml-auto truncate">{me.name}</span>}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto">
        <Outlet />
      </main>

      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  )
}
