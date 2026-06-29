import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function Reports() {
  return (
    <ComingSoon
      title="Reports"
      description="Daily, weekly, monthly and yearly analytics with exports."
      icon={BarChart3}
      note="Detailed reports and PDF/CSV/Excel export are coming next. Your dashboard already shows live charts and totals."
    />
  );
}
