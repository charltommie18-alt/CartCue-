'use client';

export default function SubscribeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded- bg-white p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">⏰</div>
        <h2 className="mt-4 text-xl font-black">Trial Expired</h2>
        <p className="mt-2 text-sm text-neutral-500">Your 3-day free trial is over. Subscribe to continue generating unlimited Amazon kits with photos.</p>

        <div className="mt-5 rounded-xl bg-neutral-50 p-3 text-left text-sm">
          <p>✓ Unlimited generations</p>
          <p>✓ Product photos + affiliate links</p>
          <p>✓ $4.99/mo via Amazon</p>
        </div>

        <a href="/subscription" className="mt-5 block w-full rounded-full bg-orange-500 py-3.5 font-bold text-white">Subscribe $4.99/mo</a>
        <button onClick={onClose} className="mt-3 text-sm text-neutral-400">Maybe later</button>
      </div>
    </div>
  );
}
