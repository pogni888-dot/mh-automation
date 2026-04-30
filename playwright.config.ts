import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* CI 환경에서는 로컬 크롬 연결(CDP)이 필요한 특정 파일들만 제외 */
  testIgnore: process.env.CI ? ['**/kakao_giftbox_cdp.spec.ts', '**/kakao_wishlist.spec.ts'] : undefined,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'list', // 서버에서 멈추지 않도록 html 대신 list 사용
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* 서버(Docker)에서는 headless: true 필수! (모니터/X서버 없음) */
    headless: true,
    locale: 'ko-KR', // 브라우저 언어 한국어로 고정 (카테고리명 영어 노출 방지)

    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Viewport: 1920x1080 고정 → PC 화면처럼 렌더링 (모바일 레이아웃 방지) */
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',

    launchOptions: {
      args: [
        "--window-size=1920,1080",
        "--force-device-scale-factor=1",
        "--disable-gpu",
        "--no-sandbox"
      ]
    },
    video: 'on', // 비디오 녹화 켜기 (모든 테스트 녹화)
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        // viewport: null, // 상위 설정(1920x1080) 따름
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'MicrosoftEdge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'GoogleChrome',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     channel: 'chrome',
    //     viewport: null, // Override device viewport
    //     deviceScaleFactor: undefined, // Unset device scale factor
    //   },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
