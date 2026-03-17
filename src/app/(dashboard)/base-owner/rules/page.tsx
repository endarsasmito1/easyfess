"use client";

import { trpc } from "@/lib/trpc";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { FileText, Save, Eye, Bold, Italic, List, ListOrdered, Heading2, Quote } from "lucide-react";

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  const items = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading") },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
  ];
  return (
    <div className="flex items-center gap-1 p-2 border-b border-border">
      {items.map((item, i) => (
        <button key={i} onClick={item.action} className={`p-2 rounded-lg transition-colors ${item.active ? "bg-primary/15 text-primary" : "text-text-secondary hover:bg-bg-card-hover"}`}>
          <item.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

export default function RulesEditorPage() {
  const { data: bases } = trpc.base.listOwned.useQuery();
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const selectedBase = bases?.find((b) => b.id === selectedBaseId);

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Tulis aturan base di sini..." })],
    content: selectedBase?.rulesHtml ?? "",
    editorProps: { attributes: { class: "tiptap" } },
  });

  const updateRules = trpc.base.updateRules.useMutation({
    onSuccess: () => toast.success("Aturan berhasil disimpan & dipublikasikan!"),
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    if (!selectedBaseId || !editor) return;
    updateRules.mutate({ id: selectedBaseId, rulesHtml: editor.getHTML() });
  };

  return (
    <div className="animate-slide-up max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Rules Editor</h1>
        <p className="text-text-secondary">Tulis aturan base dan publikasikan sebagai halaman publik</p>
      </div>

      <div className="mb-6">
        <select value={selectedBaseId} onChange={(e) => setSelectedBaseId(e.target.value)} className="input">
          <option value="">Pilih base...</option>
          {bases?.map((b) => <option key={b.id} value={b.id}>{b.displayName}</option>)}
        </select>
      </div>

      {selectedBaseId && (
        <>
          <div className="card overflow-hidden mb-4">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
          </div>

          <div className="flex items-center justify-between">
            {selectedBase && (
              <p className="text-xs text-text-muted">
                URL publik: <span className="text-primary">easyfess.com/base/{selectedBase.slug}/rules</span>
              </p>
            )}
            <button onClick={handleSave} disabled={updateRules.isPending} className="btn btn-primary">
              <Save className="w-4 h-4" /> {updateRules.isPending ? "Menyimpan..." : "Simpan & Publish"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
