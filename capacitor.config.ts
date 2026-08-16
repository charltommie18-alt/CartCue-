import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cartcue.app",
  appName: "CartCue",
  webDir: "public",
  server: {
    url: "https://YOUR-APP-URL.onrender.com",
    cleartext: false,
  },
};

export default config;
