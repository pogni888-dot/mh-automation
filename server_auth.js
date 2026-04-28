const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const authFile = path.resolve(__dirname, 'auth.json');

    const browser = await chromium.launch({
        headless: true,
        args: ['--window-size=1920,1080', '--force-device-scale-factor=1', '--no-sandbox', '--disable-gpu']
    });
    const ctx = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });
    const page = await ctx.newPage();

    console.log('1. 카카오 선물하기 홈 이동...');
    await page.goto('https://gift.kakao.com/home');
    await page.waitForTimeout(3000);
    console.log('  현재 URL:', page.url());

    // 로그인 버튼 클릭
    const loginBtn = page.locator('a.link_login');
    if (await loginBtn.isVisible()) {
        console.log('2. 로그인 버튼 클릭...');
        await loginBtn.click();
        await page.waitForTimeout(3000);
        console.log('  현재 URL:', page.url());
    } else {
        console.log('2. 로그인 버튼 없음, 직접 로그인 페이지 이동...');
        await page.goto('https://accounts.kakao.com/login?continue=https://gift.kakao.com/home');
        await page.waitForTimeout(3000);
        console.log('  현재 URL:', page.url());
    }

    // 아이디/비밀번호 입력
    try {
        console.log('3. 로그인 정보 입력...');
        await page.fill('#loginId--1', process.env.KAKAO_ID || '');
        await page.waitForTimeout(500);
        await page.fill('#password--2', process.env.KAKAO_PW || '');
        await page.waitForTimeout(500);

        console.log('4. 로그인 버튼 클릭...');
        await page.click('button.btn_g.highlight.submit');
        await page.waitForTimeout(5000);
        console.log('  로그인 후 URL:', page.url());

        // 페이지 상태 확인
        const html = await page.content();
        const hasLogout = html.includes('btn_logout');
        const hasSearch = html.includes('link_search');
        const hasError = html.includes('로그인이 필요한') || html.includes('error');
        const hasCaptcha = html.includes('captcha') || html.includes('보안');

        console.log('  로그아웃 버튼:', hasLogout);
        console.log('  검색 링크:', hasSearch);
        console.log('  에러 메시지:', hasError);
        console.log('  캡챠/보안:', hasCaptcha);

        if (hasLogout || hasSearch) {
            console.log('5. ✅ 로그인 성공! auth.json 저장 중...');
            await ctx.storageState({ path: authFile });
            const data = JSON.parse(fs.readFileSync(authFile, 'utf8'));
            console.log('  저장된 쿠키 개수:', data.cookies.length);
        } else {
            console.log('5. ❌ 로그인 실패. 캡챠 또는 보안 차단일 수 있음.');
            // 페이지 스냅샷 저장
            const snapshot = await page.content();
            fs.writeFileSync('/app/login_debug.html', snapshot);
            console.log('  디버그 HTML 저장: /app/login_debug.html');
        }
    } catch (e) {
        console.log('오류 발생:', e.message);
        // 페이지 스냅샷 저장
        const snapshot = await page.content();
        fs.writeFileSync('/app/login_debug.html', snapshot);
        console.log('  디버그 HTML 저장: /app/login_debug.html');
    }

    await browser.close();
})();
