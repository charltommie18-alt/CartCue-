import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cartcue.app",
  appName: "CartCue",
  webDir: "public",
  server: {
    // Must match the live Next.js deployment that contains the latest IAP code.
    // Render is currently suspended — use the working Vercel URL.
    url: "https://cart-cue.vercel.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
