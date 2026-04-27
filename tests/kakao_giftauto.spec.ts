import { test, expect } from '@playwright/test';


test('네이버 검색', async ({ page }) => {
    // 1. 페이지 접속
    await page.goto('https://naver.com');

    // 2. 요소(Locator)를 변수에 할당
    // 변수명에 'Input'이나 'SearchBox' 등을 붙여 의미를 명확히 합니다.
    const searchInput = page.locator('#query');

    // 3. 변수를 사용하여 동작 수행
    await searchInput.fill('Playwright');
    await searchInput.press('Enter');

    // 4. 결과 확인
    await expect(page).toHaveTitle(/Playwright/);

    // 5. 대기 (디버깅용)
    await page.waitForTimeout(5000);
});