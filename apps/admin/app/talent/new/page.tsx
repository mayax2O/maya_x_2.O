"use client";

import { useRouter } from "next/navigation";

import { AdminShell } from "../../../components/layout/AdminShell";
import { TalentForm } from "../../../components/talent/TalentForm";

function NewTalentContent() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-porcelain">
          Add new talent
        </h1>
        <p className="mt-1 text-[14px] text-porcelain/60">
          Create a new talent profile in the catalog.
        </p>
      </div>
      <div className="max-w-3xl rounded-lg border border-white/10 bg-ink-soft p-6">
        <TalentForm onSaved={(talent) => router.push(`/talent/${talent.id}`)} />
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
