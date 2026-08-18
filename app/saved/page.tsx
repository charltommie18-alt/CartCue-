"use client";

import { useEffect, useState } from "react";
import { getSavedKits } from "@/lib/storage";

export default function SavedPage() {
  const [kits, setKits] = useState<any[]>([]);

  useEffect(() => {
    setKits(getSavedKits());
  }, []);

  return (
    <main className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-900">
            Saved CartCue Kits
          </h1>

          <a
            href="/"
            className="text-sm font-medium text-orange-600 hover:underline"
          >
            ← Back
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        {kits.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
            <h2 className="text-lg font-semibold">
              No saved kits yet
            </h2>

            <p className="mt-2 text-sm text-neutral-600">
              Generate a CartCue content kit and save it to see it
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {kits.map((kit, index) => (
              <div
                key={kit.id ?? index}
                className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <h2 className="font-semibold">
                  {kit.title ?? `Saved kit ${index + 1}`}
                </h2>

                <pre className="mt-3 overflow-auto whitespace-pre-wrap text-sm text-neutral-700">
                  {JSON.stringify(kit, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
