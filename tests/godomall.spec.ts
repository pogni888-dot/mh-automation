import { test, expect } from '@playwright/test';

test.describe('고도몰 추천 상품 테스트', () => {
  test('쇼핑몰 사장님 추천 상품 중 첫 번째 상품 클릭', async ({ page }) => {
    // 1. 페이지 진입
    await page.goto('https://pogni81143.godomall.com/');

    // 2. 특정 상품 영역(.goods_content_1)으로 화면 스크롤(앵커)
    const targetSection = page.locator('div.goods_content_1');
    await targetSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);


    // 3. 하위 구조 탐색 후 첫 번째 상품의 .item_cont 요소 클릭
    const firstProductItem = targetSection.locator('.item_hover_type ul li').first().locator('.item_cont');
    await firstProductItem.click();

    // 4. 4초 대기 (사용자 명시적 요청)
    await page.waitForTimeout(4000);
  });
});
