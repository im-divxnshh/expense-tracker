import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export function ComingSoon({
  title,
  description,
  icon,
  note,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  note: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title="Coming soon" description={note} />
    </div>
  );
}
