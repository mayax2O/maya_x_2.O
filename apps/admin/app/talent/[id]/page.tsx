"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminShell } from "../../../components/layout/AdminShell";
import { TalentForm } from "../../../components/talent/TalentForm";
import { TalentGallery } from "../../../components/talent/TalentGallery";
import { TalentProfilePreview } from "../../../components/talent/TalentProfilePreview";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Skeleton } from "../../../components/ui/Skeleton";
import { getTalent } from "../../../lib/data/talent";
import type { Talent } from "../../../lib/types";

function EditTalentContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    getTalent(params.id)
      .then(setTalent)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load talent."),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full max-w-3xl" />
      </div>
    );
  }

  if (error || !talent) {
    return <ErrorState message={error ?? "Talent not found."} onRetry={load} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-porcelain">
            {talent.displayName}
          </h1>
          <p className="mt-1 text-[14px] text-porcelain/60">
            Edit this talent&apos;s profile, gallery, and pricing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/talent")}
          className="rounded-md border border-white/15 px-4 py-2 text-[13.5px] text-porcelain/80 hover:bg-white/5"
        >
          Back to Talent
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          <div className="rounded-lg border border-white/10 bg-ink-soft p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-porcelain">
              Gallery
            </h2>
            <TalentGallery
              talentId={talent.id}
              media={talent.media}
              onChange={(media) =>
                setTalent((prev) => (prev ? { ...prev, media } : prev))
              }
            />
          </div>

          <div className="rounded-lg border border-white/10 bg-ink-soft p-6">
            <TalentForm talent={talent} onSaved={setTalent} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-semibold text-porcelain">
            Profile preview
          </h2>
          <TalentProfilePreview talent={talent} />
        </div>
      </div>
    </div>
  );
}

export default function EditTalentPage() {
  return (
    <AdminShell>
      <EditTalentContent />
    </AdminShell>
  );
}
