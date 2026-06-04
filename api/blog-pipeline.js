// api/blog-pipeline.js
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
    // [긴급 수정] 최근 구글 AI 스튜디오에서 지원 중단된 1.5 모델 대신, 
    // 현재 가장 안정적이고 공식 지원되는 v1beta의 gemini-2.5-flash 또는 gemini-3.5-flash 계열로 호출 주소를 전면 교체했습니다.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `너는 네이버 블로그 상위 노출 전문 분석가이자 작가야. 다음 7단계 파이프라인 규칙에 따라 블로그 글을 작성해줘.
            
            [파이프라인 단계]
            1단계: 사용자가 키워드를 제공한다. (입력된 키워드: ${keyword})
            2단계: 검색 분석 에이전트가 해당 키워드의 상위 검색 의도와 제목 패턴을 분석한다.
            3단계: 근거 수집 에이전트가 신뢰할 수 있는 법령이나 실거래가 자료를 수집한다.
            4단계: 본문 작성 에이전트가 독자가 읽기 쉽게 친절한 톤으로 초안을 작성한다.
            5단계: 이미지 에이전트가 커버와 섹션 이미지가 들어갈 최적의 위치를 본문에 표시한다.
            6단계: HTML 변환 에이전트가 네이버 블로그 스마트에디터에 바로 복사해서 붙여넣기 좋은 형태로 변환한다.
            7단계: 사람은 최종 검수 후 복사해서 발행한다.

            [출력 조건]
            - 최종 출력물은 사용자가 7단계에서 그대로 전체 복사해 네이버 블로그에 붙여넣을 수 있도록 <p>, <h2>, <br> 태그 위주의 깨끗한 HTML 구조로만 작성해줘.
            - 마크다운 기호(\`\`\`html 등)는 절대 포함하지 말고 순수한 HTML 텍스트만 출력해.`
          }]
        }]
      })
    });

    const data = await response.json();

    // 구글 서버 에러 메시지 상세화
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
