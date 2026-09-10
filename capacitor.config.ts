import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cartcue.app",
  appName: "CartCue",
  webDir: "public",
  server: {
  url: "https://cart-cue.vercel.app",
  cleartext: false,
},
};

export default config;
