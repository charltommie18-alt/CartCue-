'use client';
import { useState } from 'react';
export default function AccountLinks() {
  const [open,setOpen]=useState(false);
  return (
    <div className="relative rounded-2xl border bg-white p-4">
      <div className="flex justify-between items-center">
        <p className="font-bold text-sm">Workflow</p>
        <button onClick={()=>setOpen(!open)} className="rounded-full border px-3 py-1 text-xs">Customize links</button>
      </div>
      {open && (
        <div className="mt-3 flex gap-2">
          <a href="https://www.amazon.com" target="_blank" className="rounded-full bg-[#FFC83D] px-4 py-2 text-xs font-bold">Open Amazon</a>
          <a href="https://www.instagram.com" target="_blank" className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white">Open Instagram</a>
        </div>
      )}
    </div>
  );
}
