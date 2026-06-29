import { GoogleGenAI } from "@google/genai";

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export async function analyzeTrends(topic: string, dateRange: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Você é um especialista em monitoramento de mídias sociais e tendências de informação. 
    Sua tarefa é simular a análise de tendências emergentes relacionadas ao tema "${topic}" no período de "${dateRange}".
    
    Por favor, gere 5 tendências realistas que poderiam estar circulando no momento. 
    Para cada tendência, forneça:
    1. Um título impactante.
    2. Uma breve descrição do que está sendo dito (2-3 frases).
    3. A plataforma principal onde está viralizando (Ex: WhatsApp, Telegram, TikTok, Twitter).
    4. Uma "Pontuação de Risco de Desinformação" (0 a 100).
    5. Por que isso é uma tendência agora.

    Retorne os dados estritamente em formato JSON com o seguinte schema:
    [
      {
        "id": "string único",
        "title": "string",
        "description": "string",
        "platform": "string",
        "misinformationRisk": number,
        "reason": "string",
        "topic": "${topic}"
      }
    ]
  `;

  const ai = getAiClient();
  if (!ai) return [];

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  try {
    const text = response.text;
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    if (jsonStart === -1 || jsonEnd === 0) throw new Error("JSON array not found in response");
    const jsonStr = text.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing trends response:", error);
    return [];
  }
}
