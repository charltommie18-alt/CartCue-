'use client';
import { useState } from 'react';

export default function AccountLinks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full border bg-white px-4 py-2 text-sm font-medium shadow-sm"
      >
        Customize links
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-20 w-80 rounded-2xl border bg-white p-4 shadow-xl">
          <a
            href="https://www.amazon.com"
            target="_blank"
            rel="noreferrer"
            className="mb-3 flex w-full items-center justify-center rounded-xl bg-[#FFC83D] py-3 font-bold"
          >
            🛒 Open Amazon
          </a>
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 font-bold text-white"
          >
            📸 Open Instagram
          </a>
          <p className="mt-4 text-xs text-neutral-500 leading-relaxed">
            Flow: open Amazon → copy product info into the form → generate → open Instagram → paste. Full auto-import and auto-posting come later with the official APIs.
          </p>
        </div>
      )}
    </div>
  );
}
