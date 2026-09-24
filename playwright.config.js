import { defineConfig, devices } from "@playwright/test";

import { BASE_URL, PORT } from "./tests/config.js";

const baseURL = BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL,
    trace: "on-first-retry",
    // Determinism: the header clock is frozen per-test where it matters, and
    // motion is off everywhere so screenshots never race an animation.
    reducedMotion: "reduce",
  },

  // Screenshots are compared only on the reference project (see visual.spec.js),
  // so a per-browser rendering difference can never make them flake.
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },

  projects: [
    // The JS-enabled projects skip the no-JS spec; it has its own project below.
    {
      name: "chromium",
      testIgnore: /nojs\.spec\.js/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testIgnore: /(nojs|visual)\.spec\.js/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testIgnore: /(nojs|visual)\.spec\.js/,
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile",
      testIgnore: /(nojs|visual)\.spec\.js/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "nojs",
      testMatch: /nojs\.spec\.js/,
      use: { ...devices["Desktop Chrome"], javaScriptEnabled: false },
    },
  ],

  webServer: {
    // A tiny Node server rather than an npm package (nothing extra to audit)
    // or python3 -m http.server (dropped requests under parallel workers).
    command: `node tests/server.js .`,
    env: { PORT: String(PORT) },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    // python3 -m http.server logs every request to stderr; it is noise here.
    stderr: "ignore",
  },
});
