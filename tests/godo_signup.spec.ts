import { test, expect } from '@playwright/test';

test('고도몰 회원 자동 생성 테스트', async ({ page }) => {
  // 1. 고도몰 관리자 페이지 로그인
  await page.goto('https://gdadmin-pogni81143.godomall.com/');
  await page.waitForTimeout(1000);

  // NHN 커머스 통합계정 로그인 창 진입
  await page.getByRole('button', { name: 'NHN 커머스 통합계정으로 최고운영자 로그인하기' }).click();
  await page.waitForTimeout(1000);

  await page.locator('input[name="username"]').fill('pogni811');
  await page.waitForTimeout(1000);

  await page.locator('input[name="password"]').fill('wpwnehQ!12');
  await page.waitForTimeout(1000);
  await page.getByRole('link', { name: '로그인' }).click();
  await page.waitForTimeout(1000);


  // 로그인 완료 후 잠시 대기 (페이지 전환 시간 확보)
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  await page.locator('span.ly_close').click();
  await page.waitForTimeout(1000);

  await page.getByRole('button', { name: '닫기' }).click();
  await page.waitForTimeout(1000);

  // 2~3. 회원 등록 페이지로 이동
  await page.goto('https://gdadmin-pogni81143.godomall.com/member/member_register.php');
  await page.waitForTimeout(1000);

  // 4. 아이디, 이름, 비밀번호 폼 채우기
  await page.locator('input[name="memId"]').fill('asd123');
  await page.waitForTimeout(1000);

  // 중복확인 버튼 클릭 (a 태그일 수 있으므로 text 활용)
  await page.locator('button#overlap_memId').click();
  await page.waitForTimeout(1000);

  // 참고: 브라우저 기본 Alert(경고창)은 Playwright가 자동 확인하므로 버튼 클릭 불필요
  // 하지만 커스텀 레이어 팝업일 경우를 대비해 예외처리로 클릭 수행
  try {
    await page.locator('text="확인"').click({ timeout: 2000 });
    await page.waitForTimeout(1000);
  } catch (e) {
    // 팝업이 없거나 브라우저 Alert으로 이미 넘어간 경우 무시
  }

  await page.locator('input[name="memNm"]').fill('6664567');
  await page.waitForTimeout(1000);

  await page.locator('input[name="memPw"]').fill('wpwnehQ!12');
  await page.waitForTimeout(1000);

  await page.locator('input[name="memPwRe"]').fill('wpwnehQ!12');
  await page.waitForTimeout(1000);

  // 6. API 요청 대기 및 5. 저장 버튼 클릭을 동시에 실행!
  const [response] = await Promise.all([
    // member_ps.php로 가는 POST 요청의 응답을 기다림
    page.waitForResponse(res =>
      res.url().includes('member_ps.php') && res.request().method() === 'POST'
    ),
    // 5. 저장 버튼 클릭
    page.locator('input[value="저장"], button:has-text("저장")').first().click()
  ]);

  // 7. 응답 상태 코드가 200(성공)인지 확인
  expect(response.status()).toBe(200);

  console.log("성공: 회원가입 API(member_ps.php) 통신이 완료되었습니다!");
});
