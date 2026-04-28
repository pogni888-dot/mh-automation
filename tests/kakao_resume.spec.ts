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

    // 수신자 초기화 (localStorage 클리어)
    await page.evaluate(() => {
        try { localStorage.clear(); sessionStorage.clear(); } catch (e) { }
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // "친구 다시 선택하기" 버튼이 보이면 UI를 통해 명시적으로 초기화
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

    //친구선택
    /*
    const friendList = page.locator('ul.list_recommfriend > li.ng-star-inserted').first();
    await page.click('div.box_profile');
    await friendList.locator('label.lab_pick > span.wrap_thumb').click();
    await page.click('button.btn_g.btn_confirm.ng-star-inserted');
    await page.waitForTimeout(1000);
    */

    // 2. 검색 버튼 클릭 및 '볼펜' 검색
    await page.click('a.link_search');
    await page.waitForTimeout(1000);

    const searchInput = page.locator('#searchInput');
    await searchInput.fill('[각인선물]사파리 볼펜-차콜블랙');
    await page.waitForTimeout(1000);
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);

    // 3. 검색 결과에서 첫 번째 상품 클릭
    await page.locator('a.link_prdunit').first().click();
    await page.waitForLoadState();

    // 4. 상품 옵션 설정
    const optionInputs = page.locator('textarea');

    // 첫 번째 입력창에 '1234' 입력
    await optionInputs.nth(0).fill('1234');
    await page.waitForTimeout(1000);

    // 두 번째 입력창에 '5678' 입력
    await optionInputs.nth(1).fill('5678');
    await page.waitForTimeout(1000);

    // 5. 옵션 저장 버튼 클릭
    await page.click('button.btn_wrtoption.on');
    await page.waitForTimeout(1000);

    // 6. 구매하기 버튼 클릭
    await page.locator('button.btn_g').nth(1).click();
    await page.waitForTimeout(1000);

    // 5. 주문정보 동의 버튼 클릭 (커스텀 제작상품)
    try {
        await page.getByRole('button', { name: '동의', exact: false }).click({ timeout: 1500 });
        await page.waitForTimeout(3000);
        await page.waitForLoadState();
    } catch (e) {
        console.log('주문정보 동의 버튼이 없거나 로드되지 않았습니다.');
        await page.waitForLoadState();
    }

    // 7. 친구 설정 체크박스 클릭
    try {
        // 추천 친구 목록이 있으면 첫 번째 클릭 (타임아웃 3초로 제한)
        const friendList = page.locator('ul.list_recommfriend > li.ng-star-inserted').first();
        await friendList.locator('label.lab_pick > span.wrap_thumb').click({ timeout: 3000 });
        await page.waitForTimeout(1000);

    } catch (e) {
        // 추천 친구가 없으면 → 일반 친구 목록에서 첫 번째 라벨 클릭
        // (input.chk_friend는 숨겨져 있고 label.lab_friend의 span이 위를 덮고 있으므로 label을 클릭)
        const firstFriendLabel = page.locator('ul.list_friends > li').first().locator('label.lab_friend');
        await firstFriendLabel.click({ timeout: 5000 });
        await page.waitForTimeout(1000);

    }
    await page.waitForTimeout(1000);

    // 8. 친구 선택하기 실행
    await page.locator('button.btn_confirm').click({ timeout: 3000 });
    await page.waitForTimeout(1000);

    // 9. 주문서 진입 버튼 클릭
    await page.locator('button.btn_g').nth(1).click();
    await page.waitForTimeout(1000);

    // 10. 주문정보 동의 버튼 클릭
    await page.locator('button#focus_btn').click();
    await page.waitForTimeout(5000);

    // 브라우저가 종료되지 않도록 일시 정지합니다.
    await page.pause();
});
