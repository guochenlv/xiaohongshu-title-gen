const API_KEY = process.env.API_KEY;
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

if (!API_KEY) {
    throw new Error('API_KEY环境变量未设置');
}

export default async function handler(req, res) {
    // 只允许POST请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只支持POST请求' });
    }

    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: '请输入主题内容' });
    }

    const prompt = `你是一个小红书爆款标题专家。请根据用户输入的主题，生成10个吸引眼球的爆款标题。

要求：
1. 标题要吸引眼球，能引发好奇
2. 使用emoji表情增加活力
3. 结合热点词：绝绝子、哭死、破防了、yyds、姐妹们、吐血整理等
4. 标题长度控制在20字以内
5. 适当使用数字对比：例如"月薪3千 vs 3万"

请按以下JSON格式返回：
{
  "titles": [
    {"title": "标题内容", "reason": "为什么这个标题会火（10字以内）"},
    ...
  ]
}

用户主题：${topic}

只返回JSON，不要其他内容。`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'qwen-plus',
                messages: [
                    { role: 'user', content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 1024,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // 尝试解析JSON
        let result;
        try {
            result = JSON.parse(content);
        } catch {
            // 如果解析失败，尝试提取JSON部分
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                result = JSON.parse(match[0]);
            } else {
                throw new Error('无法解析AI返回的内容');
            }
        }

        res.status(200).json(result);

    } catch (error) {
        console.error('生成标题失败:', error);
        res.status(500).json({ error: '生成失败，请稍后重试' });
    }
}
