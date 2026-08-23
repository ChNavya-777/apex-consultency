import {
  Award,
  ClipboardCheck,
  Compass,
  FileText,
  ListChecks,
  Luggage,
  Plane,
  UserRound,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Award,
  ClipboardCheck,
  Compass,
  FileText,
  ListChecks,
  Luggage,
  Plane,
  UserRound,
};

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Cmp = map[name] ?? GraduationCap;
  return <Cmp className={className} aria-hidden="true" />;
}
