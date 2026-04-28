import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.resolve(__dirname, '../auth.json');

// 카카오 계정 정보
const KAKAO_ID = process.env.KAKAO_ID || '';
const KAKAO_PW = process.env.KAKAO_PW || '';

/**
 * 카카오 로그인을 자동으로 처리하는 유틸리티 함수
 * 
 * 1) auth.json 쿠키가 있으면 먼저 쿠키를 로드하여 시도
 * 2) 쿠키가 없거나 만료됐으면 ID/PW로 자동 로그인
 * 3) 로그인 성공 시 auth.json 자동 저장 (다음번엔 빠르게 재사용)
 */
export async function kakaoLogin(page: Page): Promise<void> {
    // ===== 1단계: auth.json 쿠키 로드 시도 =====
    if (fs.existsSync(AUTH_FILE)) {
        try {
            const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
            if (authData.cookies && authData.cookies.length > 0) {
                console.log(`🍪 auth.json 발견! (쿠키 ${authData.cookies.length}개) 로드 중...`);
                await page.context().addCookies(authData.cookies);
            }
        } catch (e) {
            console.log('⚠️ auth.json 로드 실패. 새로 로그인합니다.');
        }
    } else {
        console.log('📝 auth.json 없음. ID/PW로 로그인을 시도합니다.');
    }

    // ===== 2단계: 카카오 홈 이동 및 로그인 상태 확인 =====
    await page.goto('https://gift.kakao.com/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 로그아웃 버튼이 보이면 → 이미 로그인 완료!
    if (await page.locator('.btn_logout').isVisible()) {
        console.log('✅ 이미 로그인되어 있습니다. (로그아웃 버튼 감지)');
        return;
    }

    // 로그인 버튼도 안 보이면 → 로그인된 상태로 간주
    const loginBtn = page.locator('a.link_login');
    if (!(await loginBtn.isVisible())) {
        console.log('✅ 로그인 버튼이 보이지 않습니다. 로그인된 상태로 간주합니다.');
        return;
    }

    // ===== 3단계: 로그인 버튼 클릭 =====
    console.log('🔵 로그인 버튼 감지. 클릭합니다...');
    await loginBtn.click();
    await page.waitForTimeout(2000);

    // 클릭 후 혹시 로그아웃 버튼이 보이면 (쿠키로 자동 로그인된 경우)
    if (await page.locator('.btn_logout').isVisible()) {
        console.log('✅ 쿠키로 자동 로그인 완료!');
        await saveAuth(page);
        return;
    }

    // ===== 4단계: ID/PW 자동 입력 =====
    console.log('🔑 ID/PW 자동 입력 중...');
    try {
        // ID 입력
        const idInput = page.locator('#loginId--1');
        await idInput.waitFor({ state: 'visible', timeout: 10000 });
        await idInput.fill(KAKAO_ID);
        await page.waitForTimeout(500);

        // PW 입력
        const pwInput = page.locator('#password--2');
        await pwInput.fill(KAKAO_PW);
        await page.waitForTimeout(500);

        // 로그인 버튼 클릭
        await page.click('button.btn_g.highlight.submit');
        console.log('🔄 로그인 요청 전송됨. 결과 대기 중...');

        // ===== 5단계: 로그인 결과 대기 =====
        // 최대 30초 동안 로그인 완료 or 에러 메시지 확인
        try {
            // 로그인 버튼이 사라지거나 홈으로 돌아올 때까지 대기
            await page.waitForURL('**/gift.kakao.com/**', { timeout: 30000 });
            await page.waitForTimeout(2000);

            // 로그인 성공 확인
            if (await page.locator('.btn_logout').isVisible() ||
                !(await page.locator('a.link_login').isVisible())) {
                console.log('✅ 로그인 성공!');
                await saveAuth(page);
                return;
            }
        } catch (e) {
            // URL 변경 대기 실패 시
        }

        // 2차 인증/캡챠 확인
        const currentUrl = page.url();
        if (currentUrl.includes('accounts.kakao.com')) {
            console.log('⚠️ 2차 인증 또는 캡챠가 감지되었습니다.');
            console.log('⏳ 최대 3분간 수동 해결을 기다립니다...');

            // 홈으로 돌아올 때까지 최대 3분 대기
            try {
                await page.waitForURL('**/gift.kakao.com/**', { timeout: 180000 });
                await page.waitForTimeout(2000);
                console.log('✅ 로그인 완료! (2차 인증 후)');
                await saveAuth(page);
            } catch (e) {
                console.log('❌ 3분 내에 로그인이 완료되지 않았습니다.');
                throw new Error('로그인 실패: 2차 인증/캡챠 해결 시간 초과');
            }
        }
    } catch (e: any) {
        console.log(`❌ 로그인 중 오류 발생: ${e.message}`);
        throw e;
    }
}

/**
 * 현재 세션(쿠키)을 auth.json에 저장
 * 다음 테스트 실행 시 자동으로 재사용됩니다.
 */
async function saveAuth(page: Page): Promise<void> {
    try {
        const storageState = await page.context().storageState();
        fs.writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2));
        console.log(`💾 auth.json 저장 완료! (쿠키 ${storageState.cookies.length}개)`);
    } catch (e) {
        console.log('⚠️ auth.json 저장 실패 (권한 문제일 수 있음)');
    }
}

export { AUTH_FILE };
