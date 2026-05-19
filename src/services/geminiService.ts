import { GoogleGenAI } from "@google/genai";
import { Evidence, NewsItem, ReportStructure } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateDraftReport(news: NewsItem, reportStructure: ReportStructure) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Você é um checador de fatos profissional. 
    A IA utilizará os padrões oficiais de redação da plataforma (clareza, precisão e justiça) para analisar este texto.
    
    Com base na notícia abaixo e nos dados estruturados do relatório, gere um parecer de checagem completo e profissional.
    
    Notícia: ${news.title}
    Conteúdo: ${news.content}
    
    Dados Estruturados:
    - Resumo: ${reportStructure.summary}
    - Perguntas a responder: ${reportStructure.questions.join(', ')}
    - Fontes: ${reportStructure.sources.join(', ')}
    - Inverificável: ${reportStructure.isInverifiable ? 'Sim' : 'Não'}
    - Contato com o Autor: ${reportStructure.contactWithAuthor.hadContact ? 'Sim' : 'Não'}
    ${reportStructure.contactWithAuthor.hadContact ? `- Resposta do Autor: ${reportStructure.contactWithAuthor.response}` : `- Justificativa de não contato: ${reportStructure.contactWithAuthor.justification}`}
    - Etiqueta: ${reportStructure.label}
    
    Instruções:
    1. Formate o texto de forma clara, precisa e justa.
    2. Use Markdown.
    3. Se houver trechos que não estejam compreensíveis ou que careçam de tom de neutralidade, aponte-os e sugira correções ao final do texto.
    
    Retorne o parecer final em Markdown.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
}

export async function generateArticleSuggestions(title: string, content: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Você é um editor sênior de uma agência de checagem.
    Com base no título e conteúdo de uma checagem abaixo, gere 3 sugestões de títulos alternativos atraentes e 1 resumo (lead) de 2 parágrafos para uma matéria jornalística.
    
    Título: ${title}
    Conteúdo: ${content}
    
    Retorne o resultado em formato JSON com o seguinte schema:
    {
      "titles": ["Sugestão 1", "Sugestão 2", "Sugestão 3"],
      "excerpt": "Texto do lead aqui..."
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  try {
    const text = response.text;
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) throw new Error("JSON not found in response");
    const jsonStr = text.substring(jsonStart, jsonEnd);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return {
      titles: [title],
      excerpt: content.substring(0, 200) + "..."
    };
  }
}

export async function reviewReport(text: string) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    Você é um revisor de checagem de fatos. 
    A IA utilizará os padrões oficiais de redação da plataforma (clareza, precisão e justiça) para analisar este texto.
    
    Revise o seguinte parecer de checagem de fatos para melhorar a clareza, gramática e tom profissional (neutralidade).
    
    Texto:
    ${text}
    
    Instruções:
    1. Aponte trechos que não estejam compreensíveis ou que careçam de tom de neutralidade.
    2. Sugira as correções necessárias.
    3. Retorne o texto revisado em Markdown, seguido de uma seção "Sugestões de Melhoria" se houver.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
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
