import { BellRing } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function Reminders() {
  return (
    <ComingSoon
      title="Reminders"
      description="Stay on top of due dates and pending collections."
      icon={BellRing}
      note="Due-date buckets and reminder actions arrive in the next update. Meanwhile, set due dates on a person to see them surface on the dashboard."
    />
  );
}
