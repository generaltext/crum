import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { allTags, entitiesWithTag } from '../lib/reducer'
import { KINDS, tagColor, titleField } from '../lib/model'
import { EmptyState } from '../components/common'
import { TagChip } from '../components/TagEditor'
import { EntityLink } from '../components/EntityLink'
import { Icon, type IconName } from '../components/Icon'

export function TagsView() {
  const { label } = useParams()
  const { state, config } = useStore()
  const navigate = useNavigate()
  const tags = allTags(state)

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <header className="mb-5 flex items-center gap-3">
        <Icon name="Tag" size={20} style={{ color: 'var(--muted)' }} />
        <h1 className="text-xl font-semibold">Tags</h1>
      </header>

      {tags.length === 0 ? (
        <EmptyState icon="Tag" title="No tags yet" hint="Add tags to people, orgs, opportunities, and deals to group them." />
      ) : (
        <div className="mb-6 flex flex-wrap gap-2">
          {tags.map((t) => (
            <TagChip
              key={t.label}
              label={`${t.label} · ${t.count}`}
              color={tagColor(t.label, config)}
              onClick={() => navigate(`/tags/${encodeURIComponent(t.label)}`)}
            />
          ))}
        </div>
      )}

      {label && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Tagged “{label}”</h2>
          <ul className="rowlist">
            {entitiesWithTag(state, label).map((e) => (
              <li key={e.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <Icon name={KINDS[e.kind].icon as IconName} size={15} style={{ color: 'var(--muted)' }} />
                <EntityLink id={e.id} label={String(e.fields[titleField(e.kind)] ?? '')} />
                <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>
                  {KINDS[e.kind].singular}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
