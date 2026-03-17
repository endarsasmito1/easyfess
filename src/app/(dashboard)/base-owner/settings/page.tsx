"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Settings, Plus, Trash2, Shield } from "lucide-react";

export default function BaseSettingsPage() {
  const { data: bases } = trpc.base.listOwned.useQuery();
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [newWord, setNewWord] = useState("");

  const { data: blacklist } = trpc.moderation.listBlacklist.useQuery(
    { baseId: selectedBaseId || undefined },
    { enabled: !!selectedBaseId }
  );

  const addWord = trpc.moderation.addBlacklistWord.useMutation({
    onSuccess: () => { toast.success("Kata ditambahkan"); setNewWord(""); },
    onError: (err) => toast.error(err.message),
  });

  const removeWord = trpc.moderation.removeBlacklistWord.useMutation({
    onSuccess: () => toast.success("Kata dihapus"),
  });

  return (
    <div className="animate-slide-up max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Pengaturan Base</h1>
        <p className="text-text-secondary">Atur trigger word dan blacklist</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Pilih Base</label>
        <select value={selectedBaseId} onChange={(e) => setSelectedBaseId(e.target.value)} className="input">
          <option value="">Pilih base...</option>
          {bases?.map((b) => <option key={b.id} value={b.id}>{b.displayName}</option>)}
        </select>
      </div>

      {selectedBaseId && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold">Blacklist Words</h2>
          </div>

          <div className="flex gap-2 mb-4">
            <input value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="Tambah kata..." className="input flex-1" />
            <button onClick={() => addWord.mutate({ baseId: selectedBaseId, word: newWord })} disabled={!newWord.trim()} className="btn btn-primary btn-sm">
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>

          <div className="space-y-2">
            {blacklist?.base?.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-2 rounded-lg bg-bg-card-hover">
                <span className="text-sm font-mono">{w.word}</span>
                <button onClick={() => removeWord.mutate({ id: w.id })} className="p-1 text-danger hover:bg-danger/10 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!blacklist?.base?.length && <p className="text-sm text-text-muted py-4 text-center">Belum ada blacklist word</p>}
          </div>
        </div>
      )}
    </div>
  );
}
