import { generateSW } from "workbox-build";

const { count, size, warnings } = await generateSW({
  globDirectory: "out",
  globPatterns: ["**/*.{html,js,css,png,svg,webmanifest,ico}"],
  globIgnores: ["**/404.html"],
  swDest: "out/sw.js",
  navigateFallback: "/index.html",
  navigateFallbackDenylist: [/^\/_next\//],
  directoryIndex: "index.html",
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  inlineWorkboxRuntime: true,
  maximumFileSizeToCacheInBytes: 5_000_000,
});

if (warnings.length) throw new Error(`Service worker generation warned: ${warnings.join("; ")}`);
if (count === 0) throw new Error("Service worker has no cached assets.");
console.log(`Service worker precaches ${count} files (${size} bytes).`);
