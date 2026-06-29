"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/money";
import { cn } from "@/lib/utils";

type Accent = "primary" | "success" | "danger" | "warning" | "neutral";

const accentMap: Record<Accent, { icon: string; ring: string }> = {
  primary: { icon: "bg-primary/12 text-primary", ring: "" },
  success: { icon: "bg-success/15 text-success", ring: "" },
  danger: { icon: "bg-danger/15 text-danger", ring: "" },
  warning: { icon: "bg-warning/20 text-warning-foreground", ring: "" },
  neutral: { icon: "bg-muted text-muted-foreground", ring: "" },
};

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: Accent;
  colored?: boolean;
  hint?: string;
  index?: number;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  colored,
  hint,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card glass className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              <Money amount={value} colored={colored} />
            </p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              accentMap[accent].icon,
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
