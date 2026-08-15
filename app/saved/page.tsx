"use client";

import { useEffect, useState } from "react";
import OutputTabs from "@/components/output-tabs";
import { deleteKit, loadKits } from "@/lib/storage";
import type { SavedKit } from "@/lib/types";

export default function SavedPage() {
  const [kits, setKits] = useState<SavedKit[]>([]);

  useEffect(() => {
    setKits(loadKits());
  }, []);

  function remove(id: string) {
    deleteKit(id);
    setKits(loadKits());
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-900">Saved kits</h1>
          <a
            href="/"
            className="text-sm font-medium text-orange-600 hover:underline"
          >
            ← Back to generator
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        {kits.length === 0 && (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
            No saved kits yet. Generate one and hit “Save kit”.
          </p>
        )}

        {kits.map((k) => (
          <div
            key={k.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-neutral-900">
                  {k.productName}
                </h2>
                <p className="text-xs text-neutral-500">
                  {k.style} · {k.tone} · {new Date(k.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => remove(k.id)}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-orange-600">
                View content kit
              </summary>
              <div className="mt-3">
                <OutputTabs kit={k.kit} />
              </div>
            </details>
          </div>
        ))}
      </main>
    </div>
  );
            }
