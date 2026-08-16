import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cartcue.app",
  appName: "CartCue",
  webDir: "public",
  server: {
    url: "https://cartcue-8eb4.onrender.com",
    cleartext: false,
  },
};

export default config;
