import { db } from "@/server/db";
import { bases } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicRulesPage({ params }: PageProps) {
  const { slug } = await params;

  const base = await db.query.bases.findFirst({
    where: eq(bases.slug, slug),
    columns: {
      displayName: true,
      slug: true,
      rulesHtml: true,
      triggerWord: true,
      xBaseUsername: true,
      description: true,
    },
  });

  if (!base) return notFound();

  return (
    <div className="min-h-screen bg-bg-dark">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>

        <div className="card glow-primary">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{base.displayName}</h1>
              <p className="text-text-muted text-sm">
                @{base.xBaseUsername} • Trigger: <span className="text-primary font-mono">{base.triggerWord}</span>
              </p>
            </div>
          </div>

          {base.description && <p className="text-text-secondary mb-6">{base.description}</p>}

          <hr className="border-border mb-6" />

          <h2 className="text-lg font-bold mb-4">Aturan Base</h2>
          {base.rulesHtml ? (
            <div className="prose prose-invert max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: base.rulesHtml }} />
          ) : (
            <p className="text-text-muted">Belum ada aturan yang dipublikasikan.</p>
          )}
        </div>
      </div>
    </div>
  );
}
