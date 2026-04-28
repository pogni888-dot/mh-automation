import { test, expect } from './fixtures';
import path from 'path';
import fs from 'fs';

// auth.json 사용 설정 (generate_auth.spec.ts 선행 실행 필수)
const authFile = path.resolve(__dirname, '../auth.json');
if (!fs.existsSync(authFile)) {
    console.warn('⚠️ auth.json이 없습니다! 먼저 generate_auth.spec.ts를 실행해주세요.');
}
test.use({ storageState: authFile });

test('카카오 로그인 테스트', async ({ page }) => {
    test.setTimeout(60000);

    // 1. 카카오 선물하기 홈으로 이동
    await page.goto('https://gift.kakao.com/home');
    await page.waitForTimeout(1000);

    // 2. 검색 버튼 클릭 및 '볼펜' 검색
    await page.click('a.link_search');
    await page.waitForTimeout(2000);

    const searchInput = page.locator('#searchInput');
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill('볼펜');
    await page.waitForTimeout(1000);
    await searchInput.press('Enter');
    await page.waitForTimeout(2000);

    // 3. 검색 결과에서 첫 번째 상품 클릭
    const firstProduct = page.locator('a.link_prdunit').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 10000 });
    await firstProduct.click();
    await page.waitForLoadState();
    await page.waitForTimeout(5000);
});