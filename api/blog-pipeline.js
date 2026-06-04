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

  // 비밀키가 아예 안 들어왔을 때 안전하게 먼저 차단합니다.
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Vercel 설정에 OPENAI_API_KEY가 등록되지 않았습니다.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // 팁: 타임아웃을 피하기 위해 속도가 훨씬 빠른 mini 모델로 변경했습니다!
        messages: [
          { 
            role: 'system', 
            content: `너는 네이버 블로그 자동화 에이전트야. 사용자가 키워드를 주면 다음 7단계를 거쳐 결과물을 줘.
            2단계(검색분석), 3단계(법령/실거래가 근거 가상 수집), 4단계(본문작성), 5단계(이미지 들어갈 자리 추천), 6단계(네이버 에디터용 HTML 변환).
            최종 출력은 사용자가 그대로 복사해서 네이버 블로그에 붙여넣을 수 있는 <p>, <h2> 태그 위주의 깨끗한 HTML 코드만 반환해줘. 마크다운 기호(\`\`\`html 등)는 절대 포함하지 마.` 
          },
          { role: 'user', content: `키워드: ${keyword}` }
        ]
      })
    });

    const data = await response.json();

    // OpenAI가 에러를 뱉었을 때 화면에 진짜 원인을 띄워줍니다.
    if (data.error) {
      return res.status(500).json({ success: false, error: `OpenAI 에러: ${data.error.message}` });
    }

    // 데이터 구조가 안전하게 존재하는지 확인 후 결과 반환
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const finalHtml = data.choices[0].message.content;
      return res.status(200).json({ success: true, result: finalHtml });
    } else {
      return res.status(500).json({ success: false, error: 'OpenAI로부터 올바른 응답 구조를 받지 못했습니다.' });
    }

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
