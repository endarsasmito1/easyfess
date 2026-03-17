"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, ImagePlus, X, AlertCircle } from "lucide-react";
import { MAX_TWEET_LENGTH } from "@/server/lib/constants";

export default function SubmitMenfessPage() {
  const [content, setContent] = useState("");
  const [selectedBaseId, setSelectedBaseId] = useState("");

  const { data: activeBases, isLoading: basesLoading } =
    trpc.base.listActive.useQuery();
  const { data: balance } = trpc.wallet.getBalance.useQuery();

  const submitMutation = trpc.menfess.submit.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setContent("");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const selectedBase = activeBases?.find((b) => b.id === selectedBaseId);
  const triggerWordLength = selectedBase
    ? selectedBase.triggerWord.length + 1
    : 0;
  const remainingChars = MAX_TWEET_LENGTH - triggerWordLength - content.length;
  const maxContentLength = MAX_TWEET_LENGTH - triggerWordLength;
  const hasBalance = (balance?.balance ?? 0) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBaseId || !content.trim()) return;

    submitMutation.mutate({
      baseId: selectedBaseId,
      content: content.trim(),
    });
  };

  return (
    <div className="animate-slide-up max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Kirim Menfess</h1>
        <p className="text-text-secondary">
          Tulis pesanmu dan kirim ke base tujuan
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Base Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Base Tujuan</label>
          <select
            value={selectedBaseId}
            onChange={(e) => setSelectedBaseId(e.target.value)}
            className="input"
            disabled={basesLoading}
          >
            <option value="">Pilih base tujuan...</option>
            {activeBases?.map((base) => (
              <option key={base.id} value={base.id}>
                {base.displayName} (@{base.xBaseUsername}) — [{base.triggerWord}]
              </option>
            ))}
          </select>
        </div>

        {/* Trigger Word Preview */}
        {selectedBase && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
            <span className="text-primary font-mono text-sm font-bold">
              {selectedBase.triggerWord}
            </span>
            <span className="text-text-muted text-sm">
              akan ditambahkan otomatis di awal pesan
            </span>
          </div>
        )}

        {/* Content Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Isi Menfess</label>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis menfess-mu di sini..."
              rows={5}
              maxLength={maxContentLength}
              className="input resize-none"
              style={{ paddingBottom: "2.5rem" }}
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span
                className={`text-xs font-mono ${
                  remainingChars < 0
                    ? "text-danger"
                    : remainingChars < 30
                      ? "text-warning"
                      : "text-text-muted"
                }`}
              >
                {remainingChars}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Warning */}
        {!hasBalance && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-danger">
                Saldo koin habis
              </p>
              <p className="text-xs text-text-secondary mt-1">
                Top-up koin terlebih dahulu untuk mengirim menfess.
              </p>
              <a
                href="/dashboard/topup"
                className="btn btn-primary btn-sm mt-3"
              >
                Top-Up Koin
              </a>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={
            !selectedBaseId ||
            !content.trim() ||
            !hasBalance ||
            remainingChars < 0 ||
            submitMutation.isPending
          }
          className="btn btn-primary btn-lg w-full justify-center"
        >
          {submitMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {submitMutation.isPending ? "Mengirim..." : "Kirim Menfess (1 Koin)"}
        </button>

        <p className="text-xs text-text-muted text-center">
          Saldo saat ini:{" "}
          <span className="text-warning font-bold">
            {balance?.balance ?? 0} Koin
          </span>
        </p>
      </form>
    </div>
  );
}
