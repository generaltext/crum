import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './lib/store'
import { Layout } from './components/Layout'
import { EntityListPage } from './routes/EntityListPage'
import { DealsBoard } from './routes/DealsBoard'
import { EntityDetail } from './routes/EntityDetail'
import { TagsView } from './routes/TagsView'
import { ActivityFeed } from './routes/ActivityFeed'
import { Icon } from './components/Icon'

function Splash() {
  return (
    <div className="flex h-full items-center justify-center" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
      <div className="flex items-center gap-2 text-sm">
        <Icon name="Users" size={18} />
        Loading CRUM…
      </div>
    </div>
  )
}

export function App() {
  const { ready } = useStore()
  if (!ready) return <Splash />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/people" replace />} />
        <Route path="/people" element={<EntityListPage kind="person" />} />
        <Route path="/orgs" element={<EntityListPage kind="org" />} />
        <Route path="/opportunities" element={<EntityListPage kind="opp" />} />
        <Route path="/deals" element={<DealsBoard />} />
        <Route path="/e/:id" element={<EntityDetail />} />
        <Route path="/tags" element={<TagsView />} />
        <Route path="/tags/:label" element={<TagsView />} />
        <Route path="/activity" element={<ActivityFeed />} />
        <Route path="*" element={<Navigate to="/people" replace />} />
      </Route>
    </Routes>
  )
}
