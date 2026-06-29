import { Settings as SettingsIcon } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function Settings() {
  return (
    <ComingSoon
      title="Settings"
      description="Owner info, currency, categories, backup and restore."
      icon={SettingsIcon}
      note="The full settings panel arrives in the next update. The app currently uses INR (₹) and your configured Firebase project."
    />
  );
}
