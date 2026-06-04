// api/blog-v2.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!keyword) {
    return res.status(400).json({ error: '키워드를 입력해주세요.' });
  }

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Vercel 설정에 API 키가 등록되지 않았습니다.' });
  }

  try {
    // 1.5 에러를 원천 차단하기 위해 현재 전 세계에서 가장 안정적으로 무료 작동하는 정석 주소로 세팅했습니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `너는 네이버 블로그 상위 노출 전문 분석가이자 작가야. 다음 7단계 파이프라인 규칙에 따라 블로그 글을 작성해줘.
            1단계(키워드 제공: ${keyword}), 2단계(검색의도 분석), 3단계(법령/실거래가 근거 가상 수집), 4단계(본문 초안 작성), 5단계(이미지 위치 추천), 6단계(네이버용 HTML 변환), 7단계(최종 검수).
            최종 출력물은 사용자가 그대로 전체 복사해 네이버 블로그에 붙여넣을 수 있도록 <p>, <h2>, <br> 태그 위주의 깨끗한 HTML 구조로만 작성해줘. 마크다운 기호(\`\`\`html 등)는 절대 포함하지 말고 순수한 HTML 텍스트만 출력해.`
          }]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      const errorMsg = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
      return res.status(500).json({ success: false, error: `구글 Gemini 에러: ${errorMsg}` });
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const finalHtml = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ success: true, result: finalHtml });
    } else {
      return res.status(500).json({ success: false, error: '구글 Gemini로부터 올바른 응답을 받지 못했습니다.' });
    }

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
