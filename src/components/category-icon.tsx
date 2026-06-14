import {
  BookOpen,
  Building2,
  Circle,
  Coffee,
  FileText,
  Gamepad2,
  Handshake,
  Home,
  Info,
  Music,
  ShoppingBag,
  Tag,
  Trophy,
  Users
} from "lucide-react";
import { formatCategoryLabel } from "@/lib/format";

const iconMap = {
  bureaucracy: FileText,
  required_documents: FileText,
  living_in_vienna: Home,
  student_life: Users,
  discounts: Tag,
  discounts_offers: Tag,
  offers: Tag,
  sports: Trophy,
  games: Gamepad2,
  chill: Coffee,
  social: Users,
  bars: Music,
  nightlife: Music,
  academic: BookOpen,
  study: BookOpen,
  official: Building2,
  administration: Building2,
  student_event: Users,
  university_event: Building2,
  external_partner: Handshake,
  external_partner_event: Handshake,
  marketplace: ShoppingBag
};

export function CategoryIcon({ category, className = "" }: { category?: string | null; className?: string }) {
  const Icon = category ? iconMap[category as keyof typeof iconMap] ?? Info : Circle;
  return <Icon className={className} size={16} aria-hidden="true" />;
}

export function CategoryLabel({ category }: { category?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink shadow-sm">
      <CategoryIcon category={category} />
      {formatCategoryLabel(category)}
    </span>
  );
}
