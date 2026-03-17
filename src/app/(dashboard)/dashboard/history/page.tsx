"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { History, ExternalLink, Filter, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const statusConfig = {
  queued: { label: "Antrean", icon: Clock, color: "warning" },
  processing: { label: "Diproses", icon: Loader2, color: "primary" },
  posted: { label: "Terkirim", icon: CheckCircle, color: "success" },
  failed: { label: "Gagal", icon: XCircle, color: "danger" },
  rejected: { label: "Ditolak", icon: XCircle, color: "danger" },
} as const;

type MenfessStatus = keyof typeof statusConfig;

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<MenfessStatus | "">("");
  const { data, isLoading } = trpc.menfess.getHistory.useQuery({
    page, limit: 20, status: statusFilter || undefined,
  });

  return (
    <div className="animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Riwayat Menfess</h1>
        <p className="text-text-secondary">Lacak status semua menfess yang pernah kamu kirim</p>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-text-muted flex-shrink-0" />
        {[{ value: "", label: "Semua" }, { value: "queued", label: "Antrean" }, { value: "posted", label: "Terkirim" }, { value: "failed", label: "Gagal" }].map((f) => (
          <button key={f.value} onClick={() => { setStatusFilter(f.value as MenfessStatus | ""); setPage(1); }}
            className={`btn btn-sm flex-shrink-0 ${statusFilter === f.value ? "bg-primary/15 text-primary border-primary/30" : "btn-secondary"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : !data?.items?.length ? (
        <div className="text-center py-20">
          <History className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
          <p className="text-text-secondary">Belum ada riwayat menfess</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => {
            const config = statusConfig[item.status as MenfessStatus];
            return (
              <div key={item.id} className="card hover:border-border-focus transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed mb-2">{item.content}</p>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span>{formatRelativeTime(item.createdAt)}</span>
                      {item.postedTweetUrl && (
                        <a href={item.postedTweetUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          Lihat Tweet <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <span className={`badge badge-${item.status} flex-shrink-0`}>
                    <config.icon className="w-3 h-3" />{config.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm">Sebelumnya</button>
          <span className="text-sm text-text-muted px-4">Halaman {page} dari {data.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn btn-secondary btn-sm">Selanjutnya</button>
        </div>
      )}
    </div>
  );
}
