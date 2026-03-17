"use client";

import { trpc } from "@/lib/trpc";
import { Coins, Send, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: profile } = trpc.auth.getProfile.useQuery();
  const { data: balance } = trpc.wallet.getBalance.useQuery();
  const { data: history } = trpc.menfess.getHistory.useQuery({ page: 1, limit: 5 });

  const stats = [
    {
      label: "Saldo Koin",
      value: balance?.balance ?? 0,
      icon: Coins,
      color: "warning",
      href: "/dashboard/topup",
    },
    {
      label: "Total Terkirim",
      value: history?.items?.filter((m) => m.status === "posted").length ?? 0,
      icon: CheckCircle,
      color: "success",
      href: "/dashboard/history",
    },
    {
      label: "Dalam Antrean",
      value: history?.items?.filter((m) => m.status === "queued").length ?? 0,
      icon: Clock,
      color: "primary",
      href: "/dashboard/history",
    },
    {
      label: "Gagal",
      value: history?.items?.filter((m) => m.status === "failed").length ?? 0,
      icon: XCircle,
      color: "danger",
      href: "/dashboard/history",
    },
  ];

  return (
    <div className="animate-slide-up">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          Halo, {profile?.xDisplayName ?? "User"} 👋
        </h1>
        <p className="text-text-secondary">
          Selamat datang kembali di Easyfess
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card card-hover">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `color-mix(in srgb, var(--color-${stat.color}) 15%, transparent)`,
                }}
              >
                <stat.icon
                  className="w-5 h-5"
                  style={{ color: `var(--color-${stat.color})` }}
                />
              </div>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-text-muted">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/submit"
          className="card card-hover flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
            <Send className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold">Kirim Menfess</div>
            <div className="text-sm text-text-secondary">
              Tulis dan kirim menfess ke base tujuan
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/topup"
          className="card card-hover flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-[#ff8c00] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold">Top-Up Koin</div>
            <div className="text-sm text-text-secondary">
              Isi saldo koin untuk mengirim menfess
            </div>
          </div>
        </Link>
      </div>

      {/* Recent History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Riwayat Terbaru</h2>
          <Link
            href="/dashboard/history"
            className="text-primary text-sm hover:underline"
          >
            Lihat semua
          </Link>
        </div>

        {!history?.items?.length ? (
          <div className="text-center py-8">
            <Send className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-30" />
            <p className="text-text-secondary">Belum ada menfess</p>
            <Link href="/dashboard/submit" className="btn btn-primary btn-sm mt-4">
              Kirim Menfess Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {history.items.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 rounded-xl bg-bg-card-hover/50 hover:bg-bg-card-hover transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm truncate">{item.content}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {new Date(item.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <span className={`badge badge-${item.status}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
