"use client";

import { useEffect, useState } from "react";

const AMAZON_KEY =
  "cartcue_amazon_link";

const INSTAGRAM_KEY =
  "cartcue_instagram_link";

const DEFAULT_AMAZON =
  "https://www.amazon.com";

const DEFAULT_INSTAGRAM =
  "https://www.instagram.com";

export default function AccountLinks() {
  const [open, setOpen] =
    useState(false);

  const [amazonLink, setAmazonLink] =
    useState(DEFAULT_AMAZON);

  const [instagramLink, setInstagramLink] =
    useState(DEFAULT_INSTAGRAM);

  useEffect(() => {
    const savedAmazon =
      localStorage.getItem(
        AMAZON_KEY
      );

    const savedInstagram =
      localStorage.getItem(
        INSTAGRAM_KEY
      );

    if (savedAmazon) {
      setAmazonLink(savedAmazon);
    }

    if (savedInstagram) {
      setInstagramLink(savedInstagram);
    }
  }, []);

  function saveLinks() {
    let amazon = amazonLink.trim();
    let instagram =
      instagramLink.trim();

    if (!amazon) {
      amazon = DEFAULT_AMAZON;
    }

    if (!instagram) {
      instagram =
        DEFAULT_INSTAGRAM;
    }

    if (
      !amazon.startsWith("http://") &&
      !amazon.startsWith("https://")
    ) {
      amazon =
        "https://" + amazon;
    }

    if (
      !instagram.startsWith("http://") &&
      !instagram.startsWith("https://")
    ) {
      instagram =
        "https://" + instagram;
    }

    localStorage.setItem(
      AMAZON_KEY,
      amazon
    );

    localStorage.setItem(
      INSTAGRAM_KEY,
      instagram
    );

    setAmazonLink(amazon);
    setInstagramLink(instagram);

    setOpen(false);
  }

  function resetLinks() {
    localStorage.removeItem(
      AMAZON_KEY
    );

    localStorage.removeItem(
      INSTAGRAM_KEY
    );

    setAmazonLink(DEFAULT_AMAZON);
    setInstagramLink(
      DEFAULT_INSTAGRAM
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-gray-900">
            Workflow
          </p>

          <p className="text-xs text-gray-500">
            Customize where the buttons open
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setOpen(!open)
          }
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {open
            ? "Close"
            : "Customize links"}
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amazon link
            </label>

            <input
              value={amazonLink}
              onChange={(e) =>
                setAmazonLink(
                  e.target.value
                )
              }
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
              placeholder="https://www.amazon.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Instagram link
            </label>

            <input
              value={instagramLink}
              onChange={(e) =>
                setInstagramLink(
                  e.target.value
                )
              }
              className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
              placeholder="https://www.instagram.com"
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
          href={amazonLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-900 shadow-sm hover:bg-yellow-500"
        >
          Open Amazon
        </a>

        <a
          href={instagramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-gray-800"
        >
          Open Instagram
        </a>
      </div>
    </div>
  );
}
