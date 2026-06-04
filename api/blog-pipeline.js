// api/blog-pipeline.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword } = req.body;
  // Vercel 설정에 등록된 키를 가져옵니다. (이름은 편리하게 그대로 두셔도 됩니다)
  const apiKey = process.env.OPENAI_API_KEY; 

  if (!keyword) {
    return res.status(400).json({ error: '키워드를 입력해주세요.' });
  }

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Vercel 설정에 API 키가 등록되지 않았습니다.' });
  }

  try {
    // 구글 AI 스튜디오 Gemini 1.5 Flash 모델 호출 주소입니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `너는 네이버 블로그 자동화 에이전트야. 사용자가 키워드를 주면 다음 7단계를 거쳐 결과물을 줘.
            2단계(검색분석), 3단계(법령/실거래가 근거 가상 수집), 4단계(본문작성), 5단계(이미지 들어갈 자리 추천), 6단계(네이버 에디터용 HTML 변환).
            최종 출력은 사용자가 그대로 복사해서 네이버 블로그에 붙여넣을 수 있는 <p>, <h2> 태그 위주의 깨끗한 HTML 코드만 반환해줘. 마크다운 기호(\`\`\`html 등)는 절대 포함하지 말고 순수한 HTML 텍스트만 줘.
            
            키워드: ${keyword}`
          }]
        }]
      })
    });

    const data = await response.json();

    // 구글 API 에러 예외 처리
    if (data.error) {
      return res.status(500).json({ success: false, error: `구글 Gemini 에러: ${data.error.message}` });
    }

    // Gemini의 답변 구조에서 텍스트 추출
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
