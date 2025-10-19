// /src/services/gemini.ts
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Per Gemini API guidelines, API key must be obtained from process.env.API_KEY.
// This also resolves the TypeScript error 'Property 'env' does not exist on type 'ImportMeta''.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function planCrop(params: {
  crop: string; region: string; soil?: string; bedWidthCm?: number; rotationYears?: number;
}) {
  const prompt = `
あなたは家庭菜園の栽培アドバイザーです。以下の条件で栽培計画を提案してください。
- 地域: ${params.region}
- 作物: ${params.crop}
- 土壌条件: ${params.soil ?? '不明'}
- 畝幅(cm): ${params.bedWidthCm ?? '不明'}
- 連作障害: ${params.rotationYears ?? '不明'} 年
出力は必ずJSON形式で、{ "schedule": [{ "date": "YYYY-MM-DD", "task": "作業内容", "note": "補足" }], "tips": ["アドバイス1", "アドバイス2"] } の構造を持つこと。
  `.trim();

  try {
    // Fix: Per Gemini API guidelines, use responseSchema for reliable JSON output.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  task: { type: Type.STRING },
                  note: { type: Type.STRING },
                },
                // note is supplemental, so not required
                required: ["date", "task"],
              },
            },
            tips: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },
          },
          required: ["schedule", "tips"],
        },
      }
    });
    
    // Fix: With responseSchema, the response is a clean JSON string, simplifying parsing.
    const text = response.text.trim();
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", e);
    return { error: "計画の取得に失敗しました。AIの応答が不正な形式である可能性があります。" };
  }
}