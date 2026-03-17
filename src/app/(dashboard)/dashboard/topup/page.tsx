"use client";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Coins, QrCode, Check, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function TopUpPage() {
  const { data: balance } = trpc.wallet.getBalance.useQuery();
  const { data: packages } = trpc.wallet.getPackages.useQuery();
  const topUpMutation = trpc.wallet.createTopUp.useMutation({
    onSuccess: (data) => {
      toast.success("Transaksi dibuat! Silakan scan QRIS.");
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="animate-slide-up max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Top-Up Koin</h1>
        <p className="text-text-secondary">Isi saldo koin untuk mengirim menfess</p>
      </div>

      <div className="card glow-primary mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-warning to-[#ff8c00] flex items-center justify-center">
            <Coins className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="text-sm text-text-muted">Saldo Saat Ini</div>
            <div className="text-3xl font-bold">{balance?.balance ?? 0} <span className="text-lg text-text-secondary">Koin</span></div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4">Pilih Paket</h2>
      <div className="grid grid-cols-2 gap-4">
        {packages?.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => topUpMutation.mutate({ packageId: pkg.id })}
            disabled={topUpMutation.isPending}
            className="card card-hover text-left group"
          >
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-5 h-5 text-accent" />
              <span className="font-bold text-lg">{pkg.label}</span>
            </div>
            <div className="text-2xl font-bold gradient-text">{formatCurrency(pkg.priceIdr)}</div>
            <div className="text-xs text-text-muted mt-1">{formatCurrency(pkg.priceIdr / pkg.coins)}/koin</div>
          </button>
        ))}
      </div>

      <p className="text-xs text-text-muted text-center mt-8">Pembayaran via QRIS — support semua e-wallet & m-banking</p>
    </div>
  );
}
