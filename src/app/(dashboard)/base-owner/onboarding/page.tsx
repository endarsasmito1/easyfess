"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Link2, Shield, CheckCircle, AlertTriangle } from "lucide-react";

export default function OnboardingPage() {
  const [slug, setSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [triggerWord, setTriggerWord] = useState("");

  const createBase = trpc.base.create.useMutation({
    onSuccess: () => {
      toast.success("Base berhasil dibuat! Selanjutnya tautkan akun X.");
      setSlug(""); setDisplayName(""); setTriggerWord("");
    },
    onError: (err) => toast.error(err.message),
  });
  const { data: bases } = trpc.base.listOwned.useQuery();

  return (
    <div className="animate-slide-up max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Integrasi Base</h1>
        <p className="text-text-secondary">Buat dan tautkan akun X base-mu</p>
      </div>

      {bases && bases.length > 0 && (
        <div className="space-y-3 mb-8">
          <h2 className="text-lg font-bold">Base Terdaftar</h2>
          {bases.map((base) => (
            <div key={base.id} className="card flex items-center justify-between">
              <div>
                <div className="font-bold">{base.displayName}</div>
                <div className="text-sm text-text-muted">@{base.xBaseUsername ?? "belum ditautkan"} • [{base.triggerWord}]</div>
              </div>
              <span className={`badge ${base.isActive ? "badge-posted" : "badge-failed"}`}>
                {base.isActive ? <><CheckCircle className="w-3 h-3" /> Aktif</> : <><AlertTriangle className="w-3 h-3" /> Inaktif</>}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-bold mb-4">Buat Base Baru</h2>
        <form onSubmit={(e) => { e.preventDefault(); createBase.mutate({ slug, displayName, triggerWord }); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nama Base</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Contoh: Worksfess" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Slug (URL)</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="contoh: worksfess" className="input" />
            <p className="text-xs text-text-muted mt-1">easyfess.com/base/{slug || "..."}/rules</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Trigger Word</label>
            <input value={triggerWord} onChange={(e) => setTriggerWord(e.target.value)} placeholder="Contoh: worksfess" className="input" />
          </div>
          <button type="submit" disabled={!slug || !displayName || !triggerWord || createBase.isPending} className="btn btn-primary w-full justify-center">
            {createBase.isPending ? "Membuat..." : "Buat Base"}
          </button>
        </form>
      </div>
    </div>
  );
}
