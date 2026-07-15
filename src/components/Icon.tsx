import {
  Activity,
  Archive,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Circle,
  CornerDownLeft,
  ExternalLink,
  Handshake,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  User,
  Users,
  X,
  type LucideProps,
} from 'lucide-react'

const REGISTRY = {
  Activity,
  Archive,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Circle,
  CornerDownLeft,
  ExternalLink,
  Handshake,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  User,
  Users,
  X,
}

export type IconName = keyof typeof REGISTRY

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Cmp = REGISTRY[name]
  return <Cmp {...props} />
}
