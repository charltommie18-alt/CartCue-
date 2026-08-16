"use client";

import { useState } from "react";

const KEYS = ["cartcue_kits", "cartcue_plan", "cartcue_links"];

export default function DeleteDataPage() {
  const [done, setDone] = useState(false);

  function deleteAll() {
    try {
      KEYS.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // ignore
    }
    setDone(true);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-10 text-sm leading-6 text-neutral-700">
      <h1 className="text-2xl font-bold text-neutral-900">
        Account & Data Deletion
      </h1>
      <p>Last updated: August 16, 2026</p>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          No accounts, no servers
        </h2>
        <p>
          CartCue does not require registration and does not store personal
          data on servers. Your saved kits, plan status, and custom links live
          only in your device&apos;s local storage.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          How to delete your data
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Delete individual kits on the Saved kits page.</li>
          <li>Or delete everything at once with the button below.</li>
          <li>
            Or clear the browser&apos;s site data / uninstall the app — this
            also removes everything.
          </li>
        </ul>
      </section>

      <button
        onClick={deleteAll}
        className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
      >
        {done
          ? "All CartCue data deleted ✓"
          : "Delete all CartCue data on this device"}
      </button>

      {done && (
        <p className="text-green-700">
          Done. Your saved kits, trial/subscription status, and custom links
          have been removed from this device.
        </p>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          Subscriptions
        </h2>
        <p>
          If you subscribed via Amazon (CartCue_monthly_sub), cancel in your
          Amazon account under “Your Memberships & Subscriptions”. Cancelling
          stops future billing; this page removes your local data.
        </p>
      </section>

      <p className="text-xs text-neutral-500">
        Questions: your-email@example.com
      </p>
    </main>
  );
    }
