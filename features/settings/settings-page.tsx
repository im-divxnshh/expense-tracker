"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Database,
  Download,
  HardDrive,
  Monitor,
  Moon,
  Sun,
  Trash2,
  Upload,
  UserCog,
} from "lucide-react";
import { useLedger } from "@/lib/ledger-store";
import type { ImportPayload } from "@/lib/ledger-store";
import type { Settings } from "@/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { downloadJSON } from "@/lib/export";
import { todayISO } from "@/lib/utils";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "AED", label: "UAE Dirham (د.إ)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
];

export function SettingsPage() {
  const {
    settings,
    backend,
    people,
    transactions,
    expenses,
    saveSettings,
    importData,
    clearAllData,
  } = useLedger();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your profile, appearance and data."
      />

      <div className="space-y-6">
        {/* Keyed so the form re-initialises with fresh values once settings load. */}
        <ProfileForm
          key={`${settings.ownerName}|${settings.businessName ?? ""}|${settings.currency}`}
          settings={settings}
          onSave={saveSettings}
        />

        <AppearanceCard />

        <DataCard
          backend={backend}
          counts={{
            people: people.length,
            transactions: transactions.length,
            expenses: expenses.length,
          }}
          onBackup={() =>
            downloadJSON(`ledgerly-backup-${todayISO()}.json`, {
              exportedAt: new Date().toISOString(),
              app: "Ledgerly",
              settings,
              people,
              transactions,
              expenses,
            })
          }
          onRestore={importData}
          onClear={clearAllData}
        />
      </div>
    </div>
  );
}

function ProfileForm({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (patch: Partial<Settings>) => Promise<void>;
}) {
  const [ownerName, setOwnerName] = React.useState(settings.ownerName);
  const [businessName, setBusinessName] = React.useState(settings.businessName ?? "");
  const [currency, setCurrency] = React.useState(settings.currency);
  const [saving, setSaving] = React.useState(false);

  const dirty =
    ownerName !== settings.ownerName ||
    businessName !== (settings.businessName ?? "") ||
    currency !== settings.currency;

  async function handleSave() {
    if (!ownerName.trim()) {
      toast.error("Owner name is required");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ownerName: ownerName.trim(),
        businessName: businessName.trim() || undefined,
        currency,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <UserCog className="size-5 text-primary" />
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner name" htmlFor="ownerName" required>
            <Input
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Your name"
            />
          </Field>
          <Field label="Business name" htmlFor="businessName" hint="Optional">
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Rastogi Traders"
            />
          </Field>
        </div>
        <Field label="Currency" hint="Used to format all amounts across the app.">
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Sun className="size-5 text-primary" />
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <opt.icon className="size-5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DataCard({
  backend,
  counts,
  onBackup,
  onRestore,
  onClear,
}: {
  backend: "firestore" | "local";
  counts: { people: number; transactions: number; expenses: number };
  onBackup: () => void;
  onRestore: (data: ImportPayload) => Promise<unknown>;
  onClear: () => Promise<void>;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = React.useState<ImportPayload | null>(null);
  const [confirmClear, setConfirmClear] = React.useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (
          !Array.isArray(parsed.people) &&
          !Array.isArray(parsed.transactions) &&
          !Array.isArray(parsed.expenses)
        ) {
          toast.error("This file doesn't look like a Ledgerly backup");
          return;
        }
        setPending({
          people: parsed.people,
          transactions: parsed.transactions,
          expenses: parsed.expenses,
          settings: parsed.settings,
        });
      } catch {
        toast.error("Could not read backup file");
      }
    };
    reader.readAsText(file);
  }

  const incoming =
    (pending?.people?.length ?? 0) +
    (pending?.transactions?.length ?? 0) +
    (pending?.expenses?.length ?? 0);

  const total = counts.people + counts.transactions + counts.expenses;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        {backend === "firestore" ? (
          <Database className="size-5 text-success" />
        ) : (
          <HardDrive className="size-5 text-primary" />
        )}
        <CardTitle>Data &amp; backup</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">Storage</span>
          <span className="font-medium">
            {backend === "firestore" ? "Firestore (cloud)" : "Local storage"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="People" value={counts.people} />
          <Stat label="Transactions" value={counts.transactions} />
          <Stat label="Expenses" value={counts.expenses} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onBackup} disabled={total === 0}>
            <Download className="size-4" /> Download backup
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Restore from file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onFile}
          />
        </div>

        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm font-medium text-danger">Danger zone</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently remove every person, transaction and expense. Export a
            backup first if you might need this data again.
          </p>
          <Button
            variant="danger"
            className="mt-3"
            disabled={total === 0}
            onClick={() => setConfirmClear(true)}
          >
            <Trash2 className="size-4" /> Clear all data
          </Button>
        </div>
      </CardContent>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title="Restore from backup?"
        description={`This adds ${incoming} record${incoming === 1 ? "" : "s"} from the backup to your current data. It does not remove what you already have.`}
        confirmLabel="Restore"
        onConfirm={async () => {
          if (pending) await onRestore(pending);
          setPending(null);
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear all data?"
        description="Every person, transaction and expense will be removed. This cannot be undone."
        confirmLabel="Delete everything"
        destructive
        onConfirm={onClear}
      />
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background py-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
