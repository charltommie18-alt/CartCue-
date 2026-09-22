"use client";

import { useEffect, useState } from "react";

const STORE_KEY = "cartcue_store_link";
const SOCIAL_KEY = "cartcue_social_link";

const DEFAULT_STORE = "https://www.amazon.com";
const DEFAULT_SOCIAL = "https://www.instagram.com";

export default function AccountLinks() {
  const [open, setOpen] = useState(false);
  const [storeLink, setStoreLink] = useState(DEFAULT_STORE);
  const [socialLink, setSocialLink] = useState(DEFAULT_SOCIAL);

  useEffect(() => {
    const savedStore = localStorage.getItem(STORE_KEY);
    const savedSocial = localStorage.getItem(SOCIAL_KEY);

    if (savedStore) setStoreLink(savedStore);
    if (savedSocial) setSocialLink(savedSocial);
  }, []);

  function saveLinks() {
    let store = storeLink.trim();
    let social = socialLink.trim();

    if (!store) store = DEFAULT_STORE;
    if (!social) social = DEFAULT_SOCIAL;

    if (!store.startsWith("http://") && !store.startsWith("https://")) {
      store = "https://" + store;
    }

    if (!social.startsWith("http://") && !social.startsWith("https://")) {
      social = "https://" + social;
    }

    localStorage.setItem(STORE_KEY, store);
    localStorage.setItem(SOCIAL_KEY, social);

    setStoreLink(store);
    setSocialLink(social);
    setOpen(false);
  }

  function resetLinks() {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(SOCIAL_KEY);
    setStoreLink(DEFAULT_STORE);
    setSocialLink(DEFAULT_SOCIAL);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-gray-900">Workflow</p>
          <p className="text-xs text-gray-500">
            Customize where the buttons open
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {open ? "Close" : "Customize links"}
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product store link
            </label>
            <input
              value={storeLink}
              onChange={(e) => setStoreLink(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
              placeholder="https://www.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Social feed link
            </label>
            <input
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
              placeholder="https://www.example.com"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveLinks}
              className="flex-1 rounded-full bg-black py-3 font-bold text-white"
            >
              Save links
            </button>
            <button
              type="button"
              onClick={resetLinks}
              className="rounded-full border px-4 py-3 text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={storeLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-neutral-800 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-neutral-700"
        >
          Open product store
        </a>

        <a
          href={socialLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-neutral-200 px-6 py-3 text-sm font-bold text-neutral-900 shadow-sm hover:bg-neutral-300"
        >
          Open social feed
        </a>
      </div>
    </div>
  );
}
