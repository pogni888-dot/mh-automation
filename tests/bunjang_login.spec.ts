import { test, expect } from './fixtures';
import fs from 'fs';
import path from 'path';

/**
 * 번개장터 로그인 세션(bunjang_auth.json) 생성/갱신 스크립트
 * 
 * [사용법]
 * 대시보드에서 이 파일을 실행하면:
 * 1. 번개장터 로그인 페이지로 이동
 * 2. 카카오 계정으로 ID/PW 자동 입력 후 로그인
 * 3. 성공 시 bunjang_auth.json에 쿠키 저장
 * 4. 이후 다른 번개장터 테스트 파일에서 이 쿠키를 자동으로 불러와 로그인 상태 유지
 */

const authFile = path.resolve(__dirname, '../bunjang_auth.json');

test.describe('번개장터 테스트', () => {
    test.setTimeout(120000); // 2분 타임아웃 (2차 인증 대기 포함)

    test('번개장터 로그인 세션 생성', async ({ page }) => {
        // 환경변수에서 아이디/비밀번호 가져오기 (대시보드 팝업에서 입력한 값)
        const userId = process.env.KAKAO_ID;
        const userPw = process.env.KAKAO_PW;

        if (!userId || !userPw) {
            throw new Error('❌ 아이디와 비밀번호가 입력되지 않았습니다. 대시보드에서 Run Test 클릭 후 입력해주세요.');
        }

        console.log(`📂 세션 파일 저장 경로: ${authFile}`);
        console.log(`🔑 입력된 아이디: ${userId}`);

        // 1. 번개장터 페이지 진입
        await page.goto('https://m.bunjang.co.kr/');
        await page.waitForLoadState('networkidle');

        // 2. 2초 대기
        await page.waitForTimeout(2000);

        // 3. span 텍스트 '로그인/회원가입' 버튼 클릭 (getByRole 활용)
        console.log('3. 로그인/회원가입 버튼 클릭...');
        await page.getByRole('button', { name: '로그인/회원가입' }).click();

        // 4. 2초 대기
        await page.waitForTimeout(2000);

        // 5. span 텍스트 '카카오톡으로 로그인' 버튼 클릭 (getByRole 활용)
        console.log('5. 카카오톡으로 로그인 버튼 클릭...');
        await page.getByRole('button', { name: '카카오톡으로 로그인' }).click();

        // 6. 2초 대기
        await page.waitForTimeout(2000);

        // 7. 아이디 입력 필드 클릭
        console.log('7. 아이디 입력 필드 클릭...');
        await page.locator('input#loginId--1').click();

        // 8. 1초 대기
        await page.waitForTimeout(1000);

        // 9. 아이디 입력 (환경변수)
        await page.locator('input#loginId--1').fill(userId);

        // 10. 1초 대기
        await page.waitForTimeout(1000);

        // 11. 비밀번호 입력 필드 클릭
        console.log('11. 비밀번호 입력 필드 클릭...');
        await page.locator('input#password--2').click();

        // 12. 1초 대기
        await page.waitForTimeout(1000);

        // 13. 비밀번호 입력 (환경변수)
        await page.locator('input#password--2').fill(userPw);

        // 14. 1초 대기
        await page.waitForTimeout(1000);

        // 15. 로그인 버튼 클릭
        console.log('15. 로그인 버튼 클릭...');
        await page.locator('button.btn_g.highlight.submit').click();

        // 16. 로그인 완료 대기 (리다이렉트 등)
        console.log('⏳ 로그인 완료 대기 중...');
        await page.waitForTimeout(5000);

        // 17. 번개장터 홈으로 돌아왔는지 확인
        if (!page.url().includes('bunjang.co.kr')) {
            console.log('📍 번개장터 홈으로 직접 이동합니다...');
            await page.goto('https://m.bunjang.co.kr/');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
        }

        // 18. 세션(쿠키) 저장 — localStorage는 제거 (잔여 데이터 방지)
        const storageState = await page.context().storageState();
        const cookiesOnly = {
            cookies: storageState.cookies,
            origins: [] // localStorage 비움
        };
        fs.writeFileSync(authFile, JSON.stringify(cookiesOnly, null, 2));

        // 19. 저장 결과 확인
        console.log(`💾 bunjang_auth.json 저장 완료! (쿠키 ${cookiesOnly.cookies.length}개)`);

        if (cookiesOnly.cookies.length < 3) {
            console.log('⚠️ 쿠키가 너무 적습니다. 로그인이 완전히 되지 않았을 수 있습니다.');
        } else {
            console.log('🎉 세션 생성 성공! 이제 다른 번개장터 테스트 파일을 실행하면 자동 로그인됩니다.');
        }
    });
});
