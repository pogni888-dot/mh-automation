import { test, expect } from './fixtures';

test('여기어때 사이트 진입', async ({ page }) => {
    // 환경변수에서 아이디/비밀번호 가져오기 (대시보드 팝업에서 입력한 값)
    const userId = process.env.KAKAO_ID;
    const userPw = process.env.KAKAO_PW;

    if (!userId || !userPw) {
        throw new Error('❌ 아이디와 비밀번호가 입력되지 않았습니다. 대시보드에서 Run Test 클릭 후 입력해주세요.');
    }

    // 1. 여기어때 메인 페이지로 이동
    console.log('여기어때 접속 시도...');
    await page.goto('https://www.yeogi.com/', { waitUntil: 'domcontentloaded' });

    // 2. 접속 확인
    // URL이 yeogi.com을 포함하는지 확인합니다.
    await expect(page).toHaveURL(/.*yeogi\.com.*/);
    console.log('여기어때 접속 성공!');

    // 잠시 대기 (로딩되는 모습을 눈으로 확인)
    await page.waitForTimeout(3000);

    // 3. 특정 버튼 클릭 ('gc-box-button css-fih02z' 클래스)
    console.log('버튼 클릭 시도...');
    const targetButton = page.locator('button.gc-box-button.css-fih02z');

    // 버튼이 나타날 때까지 대기 후 클릭 (예외 처리 포함)
    try {
        await targetButton.waitFor({ state: 'visible', timeout: 5000 });
        await targetButton.click();
        console.log('버튼 클릭 성공!');
    } catch (e) {
        console.log('버튼을 찾을 수 없거나 이미 닫혀있습니다.');
    }

    // 4. 클릭 후 3초 대기
    await page.waitForTimeout(3000);

    // 5. 버튼 클래스의 클래스 명이 'btn kakao-login' 인 버튼 클릭 및 새 팝업(카카오 로그인) 대기
    console.log('카카오 로그인 버튼 클릭 및 팝업창 대기...');
    const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.locator('button.btn.kakao-login').click()
    ]);

    // 6. 카카오 로그인 (새로운 팝업창) 노출 확인 후 3초 대기
    await popup.waitForLoadState();
    await popup.waitForTimeout(3000);

    // 7. div의 item_form 중 첫번째 요소 안의 input에 아이디 입력
    console.log('카카오 아이디 입력...');
    await popup.locator('div.item_form').nth(0).locator('input').fill(userId);

    // 8. 2초 대기
    await popup.waitForTimeout(2000);

    // 9. div의 item_form 중 두번째 요소 안의 input에 비밀번호 입력
    console.log('카카오 비밀번호 입력...');
    await popup.locator('div.item_form').nth(1).locator('input').fill(userPw);

    // 10. 2초 대기
    await popup.waitForTimeout(2000);

    // 11. div 클래스명이 confirm_btn 인 요소 안의 button(클래스 'btn_g highlight submit') 클릭
    console.log('로그인 확인 버튼 클릭...');
    await popup.locator('div.confirm_btn button.btn_g.highlight.submit').click();

    // 처리 결과를 눈으로 확인할 수 있도록 우선 3초 대기 추가
    await page.waitForTimeout(5000);
});
