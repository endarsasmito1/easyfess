"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Send, Twitter, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await signIn("twitter", { callbackUrl: "/dashboard" });
    } catch {
      toast.error("Login dibatalkan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke beranda
        </Link>

        {/* Login Card */}
        <div className="card glow-primary">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Masuk ke Easyfess</h1>
            <p className="text-text-secondary">
              Login dengan akun X untuk mulai mengirim menfess
            </p>
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="btn btn-lg w-full justify-center"
            style={{
              background: "#000",
              color: "#fff",
              border: "1px solid var(--color-border)",
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Twitter className="w-5 h-5" />
            )}
            {isLoading ? "Menghubungkan..." : "Login dengan X"}
          </button>

          <p className="text-text-muted text-xs text-center mt-6 leading-relaxed">
            Dengan masuk, kamu menyetujui{" "}
            <span className="text-primary cursor-pointer hover:underline">
              Syarat & Ketentuan
            </span>{" "}
            dan{" "}
            <span className="text-primary cursor-pointer hover:underline">
              Kebijakan Privasi
            </span>{" "}
            kami.
          </p>
        </div>
      </div>
    </div>
  );
}
