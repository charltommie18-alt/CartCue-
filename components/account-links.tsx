'use client';
import { useState } from 'react';

export default function AccountLinks() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full border bg-white px-4 py-2 text-sm font-medium"
      >
        Customize links
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border bg-white p-4 shadow-2xl">
          <p className="text-xs font-bold text-neutral-500 mb-3">WORKFLOW</p>
          <a href="https://www.amazon.com" target="_blank" rel="noreferrer" className="flex w-full justify-center rounded-xl bg-[#FFC83D] py-3 font-bold text-sm">
            🛒 Open Amazon
          </a>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="mt-2 flex w-full justify-center rounded-xl bg-black py-3 font-bold text-sm text-white">
            Open Instagram
          </a>
          <p className="mt-3 text- text-neutral-500 leading-relaxed">
            Flow: Amazon → copy into form → generate → Instagram → paste.
          </p>
          <button onClick={()=>setOpen(false)} className="mt-3 w-full text-xs text-neutral-400">Close</button>
        </div>
      )}
    </div>
  );
}
