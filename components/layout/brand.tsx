import { Wallet } from "lucide-react";
import { APP_NAME } from "@/constants";

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <Wallet className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
        <p className="text-[11px] text-muted-foreground">Money Ledger</p>
      </div>
    </div>
  );
}
