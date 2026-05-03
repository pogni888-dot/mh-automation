import { test, expect } from './fixtures';
import fs from 'fs';
import path from 'path';

/**
 * 번개장터 상품 등록 자동화
 * 
 * [사전 조건]
 * - bunjang_login.spec.ts를 먼저 실행하여 bunjang_auth.json 세션 생성 필요
 * - api/image에 상품 이미지가 업로드되어 있어야 함
 */

const bunjangAuth = path.resolve(__dirname, '../bunjang_auth.json');

// 2. 저장된 번개장터 로그인 세션 불러오기 (자동 로그인)
test.use({
    storageState: fs.existsSync(bunjangAuth) ? bunjangAuth : undefined
});

test.describe('번개장터 상품 등록', () => {
    test.setTimeout(120000);

    test('상품 등록', async ({ page }) => {
        // 1. 번개장터 접속
        console.log('1. 번개장터 접속...');
        await page.goto('https://m.bunjang.co.kr/');
        await page.waitForLoadState('networkidle');

        // 3. 2초 대기
        await page.waitForTimeout(2000);

        // 4. 버튼 텍스트 '판매하기' 클릭 (getByRole 활용)
        console.log('4. 판매하기 버튼 클릭...');
        const sellBtn = page.getByRole('button', { name: '판매하기' });
        await sellBtn.scrollIntoViewIfNeeded();
        await sellBtn.click();

        // 5. 2초 대기
        await page.waitForTimeout(2000);

        // 6. api/image에 있는 이미지 파일을 input type="file"인 요소에 등록
        console.log('6. API에서 이미지 가져와서 등록...');
        const imageResponse = await page.request.get('http://localhost:3001/api/image');
        const imageList = await imageResponse.json();

        if (!imageList.images || imageList.images.length === 0) {
            throw new Error('❌ api/image에 등록된 이미지가 없습니다. Postman으로 먼저 이미지를 업로드해주세요.');
        }

        // 첫 번째 이미지를 가져옴
        const firstImage = imageList.images[0];
        console.log(`📷 이미지 파일: ${firstImage.filename}`);

        const imgResponse = await page.request.get(`http://localhost:3001/api/image/${firstImage.filename}`);
        const imageBuffer = await imgResponse.body();

        // input type="file" 요소에 이미지 등록
        await page.setInputFiles('input[type="file"]', {
            name: firstImage.filename,
            mimeType: firstImage.filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
            buffer: imageBuffer
        });
        console.log('✅ 이미지 등록 완료');

        // 7. 1초 대기
        await page.waitForTimeout(1000);

        // 8. 상품명 입력
        console.log('8. 상품명 입력...');
        const titleInput = page.getByPlaceholder('상품명을 입력해 주세요.');
        await titleInput.click();
        await titleInput.fill('테스트 상품명');
        await page.waitForTimeout(1000);

        // 9. 카테고리 선택 (여성의류 > 아우터 > 패딩)
        console.log('9. 카테고리 선택...');
        await page.getByText('남성의류', { exact: true }).click();
        await page.waitForTimeout(1000);
        await page.getByText('아우터', { exact: true }).click();
        await page.waitForTimeout(1000);
        await page.getByText('패딩', { exact: true }).click();
        await page.waitForTimeout(1000);

        // 10. 상품 상태 선택
        console.log('10. 상품 상태 선택...');
        await page.getByText('상품 상태를 선택해 주세요', { exact: true }).click();
        await page.waitForTimeout(1000);
        await page.getByText('새 상품 (미사용)', { exact: true }).click();
        await page.waitForTimeout(1000);

        // 사이즈 선택
        console.log('사이즈 선택...');
        await page.getByRole('button', { name: '사이즈를 선택해 주세요' }).click();
        await page.waitForTimeout(1000);
        await page.getByText('Free', { exact: true }).click();
        await page.getByRole('button', { name: '완료', exact: true }).click();
        await page.waitForTimeout(1000);

        // 11. 설명 입력
        console.log('11. 설명 입력...');
        // 정규식 대신 exact: false 옵션(부분 일치)을 사용하거나 전체 문자열을 넣는 것이 직관적입니다.
        const descTextarea = page.getByPlaceholder('전화번호, SNS');
        await descTextarea.click();
        await descTextarea.fill('테스트상품입니다.자동화테스트입니다.');
        await page.waitForTimeout(1000);

        // 12. 태그 입력
        console.log('12. 태그 입력...');
        const tagInput = page.getByPlaceholder('태그를 입력해 주세요 (최대 5개)');
        await tagInput.click();
        await page.waitForTimeout(1000);
        await tagInput.fill('중고');
        await page.waitForTimeout(1500);
        await page.getByText('중고오토바이', { exact: true }).click();
        await page.waitForTimeout(1000);

        // 13. 가격 입력
        console.log('13. 가격 입력...');
        const priceInput = page.getByPlaceholder('가격을 입력해 주세요');
        await priceInput.click();
        await page.waitForTimeout(1000);
        await priceInput.fill('10000');
        await page.waitForTimeout(1000);

        // 14. 등록하기 버튼 앵커링 (포커싱)
        console.log('14. 등록하기 버튼 포커싱...');
        const registerButton = page.getByRole('button', { name: '등록하기' });
        await registerButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(5000);

    });
});
