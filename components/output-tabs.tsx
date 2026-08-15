"use client";

import { useState } from "react";
import type { InstagramKit } from "@/lib/types";
import CopyButton from "./copy-button";

type TabKey = "captions" | "hashtags" | "reel" | "stories" | "carousel" | "cta";

const TABS: { key: TabKey; label: string }[] = [
  { key: "captions", label: "Captions" },
  { key: "hashtags", label: "Hashtags" },
  { key: "reel", label: "Reel" },
  { key: "stories", label: "Stories" },
  { key: "carousel", label: "Carousel" },
  { key: "cta", label: "CTA" },
];

function Block({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-800">
      {text}
    </div>
  );
}

export default function OutputTabs({
  kit,
  onSave,
  saved,
}: {
  kit: InstagramKit;
  onSave?: () => void;
  saved?: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("captions");

  const captionsAll = kit.captions.join("\n\n");
  const hashtagsAll = kit.hashtags.join(" ");
  const storiesAll = kit.storySlides
    .map((s) => `Slide ${s.slide}: ${s.text}`)
    .join("\n");
  const carouselAll = kit.carouselSlides
    .map((s) => `Slide ${s.slide}\n${s.title}\n${s.body}`)
    .join("\n\n");
  const reelAll = [...kit.reelHooks, "", kit.reelScript].join("\n");

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === t.key
                  ? "bg-orange-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {onSave && (
          <button
            onClick={onSave}
            className="rounded-md border border-orange-600 px-3 py-1.5 text-sm font-semibold text-orange-600 hover:bg-orange-50"
          >
            {saved ? "Saved ✓" : "Save kit"}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {tab === "captions" && (
          <>
            <div className="flex justify-end">
              <CopyButton text={captionsAll} label="Copy all" />
            </div>
            {kit.captions.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <Block text={c} />
                </div>
                <CopyButton text={c} />
              </div>
            ))}
          </>
        )}

        {tab === "hashtags" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {kit.hashtags.length} hashtags
              </span>
              <CopyButton text={hashtagsAll} label="Copy all" />
            </div>
            <Block text={hashtagsAll} />
          </>
        )}

        {tab === "reel" && (
          <>
            <div className="flex justify-end">
              <CopyButton text={reelAll} label="Copy all" />
            </div>
            {kit.reelHooks.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <Block text={`Hook ${i + 1}: ${h}`} />
                </div>
                <CopyButton text={h} />
              </div>
            ))}
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Block text={kit.reelScript} />
              </div>
              <CopyButton text={kit.reelScript} />
            </div>
          </>
        )}

        {tab === "stories" && (
          <>
            <div className="flex justify-end">
              <CopyButton text={storiesAll} label="Copy all" />
            </div>
            {kit.storySlides.map((s) => (
              <div key={s.slide} className="flex items-start gap-2">
                <div className="flex-1">
                  <Block text={`Slide ${s.slide}: ${s.text}`} />
                </div>
                <CopyButton text={s.text} />
              </div>
            ))}
          </>
        )}

        {tab === "carousel" && (
          <>
            <div className="flex justify-end">
              <CopyButton text={carouselAll} label="Copy all" />
            </div>
            {kit.carouselSlides.map((s) => (
              <div key={s.slide} className="flex items-start gap-2">
                <div className="flex-1">
                  <Block text={`Slide ${s.slide} — ${s.title}\n${s.body}`} />
                </div>
                <CopyButton text={`${s.title}\n${s.body}`} />
              </div>
            ))}
          </>
        )}

        {tab === "cta" && (
          <>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Block text={kit.cta} />
              </div>
              <CopyButton text={kit.cta} />
            </div>
            {kit.disclosure && (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Block text={kit.disclosure} />
                </div>
                <CopyButton text={kit.disclosure} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
                }
