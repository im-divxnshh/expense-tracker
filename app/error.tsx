"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-10">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description={error.message || "An unexpected error occurred."}
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
