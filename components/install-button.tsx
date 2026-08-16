"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [help, setHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (deferred) {
      await deferred!.prompt();
      setDeferred(null);
    } else {
      setHelp((h) => !h);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4">
      <button
        onClick={install}
        className="w-full rounded-md border border-orange-600 bg-white px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
      >
        ⬇️ Install CartCue on your home screen
      </button>

      {help && !deferred && (
        <div className="mt-2 rounded-md border border-neutral-200 bg-white p-3 text-xs text-neutral-600">
          <p className="font-semibold">How to install:</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            <li>
              <b>Android / Chrome:</b> menu ⋮ → “Add to Home screen” or
              “Install app”.
            </li>
            <li>
              <b>Fire tablet / Silk:</b> menu → “Add to Home Screen”.
            </li>
            <li>
              <b>iPhone / Safari:</b> Share → “Add to Home Screen”.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
