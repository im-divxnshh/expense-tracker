"use client";

import { useLedger } from "@/lib/ledger-store";
import { Brand } from "./brand";
import { NavLinks } from "./nav-links";
import { Avatar } from "@/components/ui/avatar";
import { Database, HardDrive } from "lucide-react";

export function Sidebar() {
  const { settings, backend } = useLedger();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/60 px-4 py-5 lg:flex">
      <div className="px-2">
        <Brand />
      </div>
      <div className="mt-7 flex-1">
        <NavLinks />
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-[11px] text-muted-foreground">
          {backend === "firestore" ? (
            <Database className="size-3.5 text-success" />
          ) : (
            <HardDrive className="size-3.5" />
          )}
          {backend === "firestore" ? "Firestore connected" : "Local storage"}
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
          <Avatar name={settings.ownerName} size="sm" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{settings.ownerName}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {settings.businessName || "Personal"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
