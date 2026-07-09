// The entity model. Entity *kinds* (org/person/opp/deal) are declared here as
// data so views, forms, the command bar, and mention search are all driven by
// one registry — adding a field is a one-line change, and a new kind is a new
// entry plus a route. Notes and comments are separate record types (they attach
// to entities and to each other), handled by the reducer directly.

export type EntityKind = 'org' | 'person' | 'opp' | 'deal'

export type FieldType = 'text' | 'rich' | 'number' | 'email' | 'url' | 'ref' | 'stage'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  /** the field that titles the record (shown as its name everywhere) */
  title?: boolean
  /** for type 'ref': which kind this points at */
  refKind?: EntityKind
  placeholder?: string
}

/** A many-to-many relationship shown on the detail page, backed by bidirectional links. */
export interface RelationDef {
  kind: EntityKind
  label: string
}

export interface KindDef {
  kind: EntityKind
  /** id prefix, e.g. 'per' → per_01J… */
  prefix: string
  /** singular / plural display labels */
  singular: string
  plural: string
  /** lucide-react icon name */
  icon: string
  /** hash route segment, e.g. 'people' */
  route: string
  fields: FieldDef[]
  /** many-to-many relations (via links) editable from this kind's detail page */
  relations?: RelationDef[]
}

export const KINDS: Record<EntityKind, KindDef> = {
  person: {
    kind: 'person',
    prefix: 'per',
    singular: 'Person',
    plural: 'People',
    icon: 'User',
    route: 'people',
    fields: [
      { key: 'name', label: 'Name', type: 'text', title: true, placeholder: 'Full name' },
      { key: 'role', label: 'Role', type: 'text', placeholder: 'Title or role' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'name@example.com' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'about', label: 'About', type: 'rich' },
    ],
    relations: [{ kind: 'org', label: 'Organizations' }],
  },
  org: {
    kind: 'org',
    prefix: 'org',
    singular: 'Organization',
    plural: 'Organizations',
    icon: 'Building2',
    route: 'orgs',
    fields: [
      { key: 'name', label: 'Name', type: 'text', title: true, placeholder: 'Organization name' },
      { key: 'website', label: 'Website', type: 'url', placeholder: 'https://' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'about', label: 'About', type: 'rich' },
    ],
    relations: [{ kind: 'person', label: 'People' }],
  },
  opp: {
    kind: 'opp',
    prefix: 'opp',
    singular: 'Opportunity',
    plural: 'Opportunities',
    icon: 'Lightbulb',
    route: 'opportunities',
    fields: [
      { key: 'title', label: 'Title', type: 'text', title: true, placeholder: 'What if we…' },
      { key: 'description', label: 'Description', type: 'rich' },
    ],
  },
  deal: {
    kind: 'deal',
    prefix: 'deal',
    singular: 'Deal',
    plural: 'Deals',
    icon: 'Handshake',
    route: 'deals',
    fields: [
      { key: 'title', label: 'Title', type: 'text', title: true, placeholder: 'Deal name' },
      { key: 'value', label: 'Value', type: 'number', placeholder: '0' },
      { key: 'org', label: 'Organization', type: 'ref', refKind: 'org' },
      { key: 'opp', label: 'Opportunity', type: 'ref', refKind: 'opp' },
      { key: 'description', label: 'Description', type: 'rich' },
    ],
  },
}

export const KIND_LIST: KindDef[] = [KINDS.person, KINDS.org, KINDS.opp, KINDS.deal]

export function kindOfId(id: string): EntityKind | null {
  const p = id.slice(0, id.indexOf('_'))
  for (const k of KIND_LIST) if (k.prefix === p) return k.kind
  return null
}

export function titleField(kind: EntityKind): string {
  return KINDS[kind].fields.find((f) => f.title)?.key ?? 'name'
}

// ── Config (pipeline stages + tag palette), stored in v0/config.json ──────────

export type StageKind = 'open' | 'won' | 'lost'

export interface Stage {
  key: string
  label: string
  kind: StageKind
}

export interface Config {
  stages: Stage[]
  /** tag label → palette color key */
  tagColors: Record<string, string>
}

export const DEFAULT_CONFIG: Config = {
  stages: [
    { key: 'lead', label: 'Lead', kind: 'open' },
    { key: 'qualified', label: 'Qualified', kind: 'open' },
    { key: 'proposal', label: 'Proposal', kind: 'open' },
    { key: 'negotiation', label: 'Negotiation', kind: 'open' },
    { key: 'won', label: 'Closed Won', kind: 'won' },
    { key: 'lost', label: 'Closed Lost', kind: 'lost' },
  ],
  tagColors: {},
}

// Curated tag colors (map to CSS classes in global.css / TagChips).
export const TAG_PALETTE = [
  'amber',
  'blue',
  'green',
  'violet',
  'rose',
  'cyan',
  'orange',
  'teal',
] as const
export type TagColor = (typeof TAG_PALETTE)[number]

export function tagColor(label: string, config: Config): TagColor {
  const explicit = config.tagColors[label]
  if (explicit && (TAG_PALETTE as readonly string[]).includes(explicit)) return explicit as TagColor
  // stable hash → palette, so an unassigned tag still gets a consistent color
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) | 0
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length]!
}
