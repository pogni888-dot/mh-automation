import { test, expect } from './fixtures';
import path from 'path';
import fs from 'fs';

// auth.json 사용 설정 (generate_auth.spec.ts 선행 실행 필수)
const authFile = path.resolve(__dirname, '../auth.json');
if (!fs.existsSync(authFile)) {
    console.warn('⚠️ auth.json이 없습니다! 먼저 generate_auth.spec.ts를 실행해주세요.');
}
test.use({ storageState: authFile });

test('장바구니 테스트', async ({ page }) => {
    test.setTimeout(60000);

    // 1. 카카오 선물하기 홈으로 이동
    await page.goto('https://gift.kakao.com/home');

    // 수신자 초기화 (localStorage 클리어!)
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

    // 디버깅: 현재 로드된 쿠키 개수 확인
    const cookies = await page.context().cookies();
    console.log(`현재 로드된 쿠키 개수: ${cookies.length}개`);
    console.log('쿠키 도메인 목록:', cookies.map(c => c.domain).join(', '));

    // 2. 검색 버튼을 찾아서 클릭
    await page.click('a.link_search');

    // 3. 검색 화면에서 헤라상품 검색
    await page.fill('#searchInput', '센슈얼 누드 스테인 틴트 (+헤라 쿨 썸머 뷰티 비치백 증정)');
    await page.keyboard.press('Enter');

    // 결과 확인을 위해 잠시 대기
    await page.waitForTimeout(2000);

    // 4. 검색 결과에서 첫 번째 상품 포커싱 & 장바구니 버튼 클릭
    await page.locator('div.unit_prd').nth(0).locator('button.btn_cart > span.ico_base.ico_cart').scrollIntoViewIfNeeded();
    await page.waitForLoadState();
    await page.waitForTimeout(1000);
    await page.locator('div.unit_prd').nth(0).locator('span.ico_cart').click();
    await page.waitForLoadState();
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

    await page.click('a.link_cart');
    await page.waitForLoadState();
    await page.waitForTimeout(3000);

    // 각인 옵션 상품이 있는지 & 미입력 각인 옵션 상품이 있는지 검사 후 임의 내용 입력
    try {
        await page.locator('em', { hasText: '작성 옵션을 입력해주세요' }).first().waitFor({ timeout: 1500 });
        const optionInputs = await page.locator('em', { hasText: '작성 옵션을 입력해주세요' }).all();
        console.log(`총 ${optionInputs.length}개의 미입력 각인 옵션을 발견했습니다.`);

        const totalCount = optionInputs.length;

        for (let i = 0; i < totalCount; i++) {
            const input = page.locator('em', { hasText: '작성 옵션을 입력해주세요' }).nth(0);
            await input.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);
            const product = input.locator('xpath=ancestor::li').first();
            await product.waitFor({ timeout: 1500 });
            await product.locator('a.btn_dropdown').click();
            await page.waitForTimeout(1000);
            await product.locator('a', { hasText: '작성 옵션 변경' }).click();
            await page.waitForTimeout(1000);

            await page.locator('textarea').first().waitFor({ timeout: 1500 });
            const textAreaInputs = await page.locator('textarea').all();
            console.log(`총 ${textAreaInputs.length}개의 각인 옵션을 발견했습니다.`);

            for (const input of textAreaInputs) {
                await input.fill('ABC');
                await page.waitForTimeout(1000);
                await page.locator('button.btn_wrtoption').click();
                await page.waitForTimeout(1000);
            }
            await page.locator('button', { hasText: '변경 완료' }).click();
            await page.waitForTimeout(3000);
        }
    } catch (e) {
        console.log('미입력 각인 옵션이 없거나 로드되지 않았습니다.');
    }
    await page.waitForTimeout(1500);
    await page.locator('div.item_btn.item_dark > button.btn_g').click();
    await page.waitForTimeout(1500);

    // 6. 현금결제 여부 노출되는지 검사
    try {
        await page.locator('button.btn_payment.btn_point').click({ timeout: 1500 });
        await page.waitForTimeout(3000);
        await page.waitForLoadState();
    } catch (e) {
        console.log('현금결제 얼럿이 미노출되거나 로드되지 않았습니다.');
        await page.waitForLoadState();
    }

    await page.waitForTimeout(1500);
});
