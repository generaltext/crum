import { useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { KINDS, titleField, type EntityKind } from '../lib/model'
import { newId } from '../lib/ids'

/** Create an entity of a kind with a title, then open its detail page. */
export function useCreateEntity() {
  const { dispatch, config } = useStore()
  const navigate = useNavigate()
  return async function create(kind: EntityKind, name: string): Promise<void> {
    const clean = name.trim()
    if (!clean) return
    const id = newId(KINDS[kind].prefix)
    const data: Record<string, unknown> = { [titleField(kind)]: clean }
    if (kind === 'deal') {
      data.stage = config.stages.find((s) => s.kind === 'open')?.key ?? config.stages[0]?.key ?? 'lead'
    }
    await dispatch({ type: `${kind}.create`, subject: id, data })
    navigate(`/e/${id}`)
  }
}
