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
  Lightbulb,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  User,
  Users,
  Wifi,
  WifiOff,
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
  Lightbulb,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  User,
  Users,
  Wifi,
  WifiOff,
  X,
}

export type IconName = keyof typeof REGISTRY

export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Cmp = REGISTRY[name]
  return <Cmp {...props} />
}
