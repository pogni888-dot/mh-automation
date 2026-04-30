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

        // 7. 4초 대기
        await page.waitForTimeout(4000);

    });
});
