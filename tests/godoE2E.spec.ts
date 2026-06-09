import { test, expect } from '@playwright/test';

test('고도몰 카테고리 검색 및 상품 클릭 E2E', async ({ page }) => {
  // 1. 홈페이지 접속
  await page.goto('https://gd1091702.godomall.com/');

  // 2. "고도몰" 카테고리 클릭
  await page.getByRole('link', { name: '고도몰', exact: true }).first().click();

  // 페이지 이동 대기
  await page.waitForLoadState('domcontentloaded');

  // 3. 검색결과 내에 첫번째 상품 클릭
  // 제공해주신 HTML 구조를 반영하여 상품명 요소를 정확히 타겟팅
  await page.locator('.item_tit_box a strong.item_name').first().click();

  // 4. 5초 대기 (요구사항)
  await page.waitForTimeout(5000);
});
