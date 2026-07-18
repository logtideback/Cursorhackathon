import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export default function MatchNotFound() {
  return (
    <div className="page">
      <EmptyState
        icon={SearchX}
        title="Match not found"
        description="That fixture is not in the current demo dataset."
        action={
          <Link
            href="/"
            className="inline-flex rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[#0b1205]"
          >
            Back to matches
          </Link>
        }
      />
    </div>
  );
}
