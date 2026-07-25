"use client";

import { useRouter } from "next/navigation";

import { AdminShell } from "../../../components/layout/AdminShell";
import { TalentForm } from "../../../components/talent/TalentForm";

function NewTalentContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-porcelain">
            Add new talent
          </h1>
          <p className="mt-1 text-[14px] text-porcelain/60">
            Create a new talent profile in the catalog.
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
            <TalentForm
              onSaved={(talent) => router.push(`/talent/${talent.id}`)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <h2 className="mb-3 font-display text-lg font-semibold text-porcelain">
              Profile preview
            </h2>
            <div className="flex aspect-[3/4] items-center justify-center rounded-lg border border-white/10 bg-ink px-4 text-center text-[12.5px] text-porcelain/40">
              Save the talent to see a profile preview.
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-ink-soft p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-porcelain">
              Gallery
            </h2>
            <p className="text-[12.5px] text-porcelain/50">
              Save the talent first to upload gallery images.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewTalentPage() {
  return (
    <AdminShell>
      <NewTalentContent />
    </AdminShell>
  );
}
