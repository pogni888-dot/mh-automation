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

    // 🔥 수신자가 이미 지정된 상태를 초기화하기 위한 로직 추가
    await page.evaluate(() => {
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) { }
    });
    // 클리어 후 적용을 위해 새로고침
    await page.reload();
    await page.waitForTimeout(2000);

    // "친구 다시 선택하기" 버튼이 혹시라도 남아있다면 클릭해서 초기화 시도
    // 1.5 "친구 다시 선택하기" 버튼이 보이면 UI를 통해 명시적으로 초기화
    try {
        // strong 태그 중 '친구 다시' 텍스트가 포함된 요소를 찾음
        const resetBtn = page.locator('strong:has-text("친구 다시")').first();
        if (await resetBtn.isVisible()) {
            console.log('🔄 [초기화] 친구 다시 선택하기 클릭');
            await resetBtn.click();
            await page.waitForTimeout(1000);

            // 확인 버튼 클릭
            const confirmBtn = page.locator('button:has-text("확인"), a:has-text("확인")').first();
            if (await confirmBtn.isVisible()) {
                console.log('🔄 [초기화] 확인 버튼 클릭');
                await confirmBtn.click();
                await page.waitForTimeout(1000);
            }

            // 닫기 버튼 대신 팝업 외부(딤드 영역) 클릭하여 닫기 시도
            // cu-popup-wrapper2 태그가 화면 전체를 덮는 딤드 레이어입니다.
            const dimmedLayer = page.locator('cu-popup-wrapper2').first();
            if (await dimmedLayer.isVisible()) {
                console.log('🔄 [초기화] 팝업 닫기 (딤드 영역 클릭)');
                // 중앙의 팝업창을 피하기 위해 좌상단 구석(10, 10)을 클릭
                await dimmedLayer.click({ position: { x: 10, y: 10 }, force: true });
            }
        }
    } catch (e) {
        console.log('⚠️ 초기화 로직 수행 중 오류 (무시됨):', e);
    }

    await page.waitForTimeout(1000);

    // 2. 검색을 통해 상품 상세 페이지 진입
    console.log('상품 검색 시작: 쥬시쿨');
    await page.click('a.link_search');
    await page.fill('#searchInput', '쥬시쿨');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // 검색 결과 첫 번째 상품 진입
    const firstProduct = page.locator('a.link_prdunit').first();
    await firstProduct.click();
    await page.waitForLoadState();
    await page.waitForTimeout(2000);

    // 상품명 저장 (검증용)
    const productTitleLocator = page.locator('h4.tit_subject');
    await productTitleLocator.waitFor();
    const productTitle = await productTitleLocator.innerText();
    console.log(`선택된 상품명: ${productTitle}`);

    // 3. 위시리스트(찜) 버튼 클릭
    const wishBtn = page.locator('button.btn_wish').first();
    await wishBtn.click();
    await page.waitForTimeout(1000);

    const wishlist = await page.locator('div.group_wshradio').nth(1);
    await wishlist.locator('span.ico_base.ico_radio').click();
    await page.waitForTimeout(1000);

    await page.locator('button.btn_wshlimit').click();
    await page.waitForTimeout(5000);
});
