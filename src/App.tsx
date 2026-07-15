import { Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './lib/store'
import { Layout } from './components/Layout'
import { Dashboard } from './routes/Dashboard'
import { EntityListPage } from './routes/EntityListPage'
import { DealsBoard } from './routes/DealsBoard'
import { EntityDetail } from './routes/EntityDetail'
import { TagsView } from './routes/TagsView'
import { ActivityFeed } from './routes/ActivityFeed'
import { AppSkeleton } from './components/Skeleton'

export function App() {
  const { ready } = useStore()
  if (!ready) return <AppSkeleton />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/people" element={<EntityListPage kind="person" />} />
        <Route path="/orgs" element={<EntityListPage kind="org" />} />
        <Route path="/deals" element={<DealsBoard />} />
        <Route path="/e/:id" element={<EntityDetail />} />
        <Route path="/tags" element={<TagsView />} />
        <Route path="/tags/:label" element={<TagsView />} />
        <Route path="/activity" element={<ActivityFeed />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
