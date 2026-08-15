import type { Metadata } from "next";
import Generator from "@/components/generator";

export const metadata: Metadata = {
  title: "CartCue — Amazon finds to Instagram content",
  description:
    "Generate Instagram captions, hashtags, reel scripts, and carousel copy for Amazon products.",
};

export default function Home() {
  return <Generator />;
}
