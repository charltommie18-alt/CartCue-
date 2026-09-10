import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cartcue.app",
  appName: "CartCue",
  webDir: "public",
  server: {
    url: "https://YOUR-VERCEL-URL.vercel.app",  // new URL
    cleartext: false,
  },
};

export default config;
