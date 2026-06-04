// api/blog-pipeline.js
export default async function handler(req, res) {
  // 1. 보안을 위해 POST 요청만 받습니다.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { keyword } = req.body; // 유저가 입력한 키워드
  const apiKey = process.env.OPENAI_API_KEY; // 설정할 비밀키

  if (!keyword) {
    return res.status(400).json({ error: '키워드를 입력해주세요.' });
  }

  try {
    // OpenAI에게 7단계 파이프라인 처리를 한 번에 깔끔하게 요청합니다.
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `너는 네이버 블로그 자동화 에이전트야. 사용자가 키워드를 주면 다음 7단계를 거쳐 결과물을 줘.
            2단계(검색분석), 3단계(법령/실거래가 근거 가상 수집), 4단계(본문작성), 5단계(이미지 들어갈 자리 추천), 6단계(네이버 에디터용 HTML 변환).
            최종 출력은 사용자가 그대로 복사해서 네이버 블로그에 붙여넣을 수 있는 <p>, <h2> 태그 위주의 깨끗한 HTML 코드만 반환해줘.` 
          },
          { role: 'user', content: `키워드: ${keyword}` }
        ]
      })
    });

    const data = await response.json();
    const finalHtml = data.choices[0].message.content;

    // 7. 사람에게 최종 검수용 HTML 돌려주기
    return res.status(200).json({ success: true, result: finalHtml });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
