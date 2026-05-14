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

export async function generateArticleSuggestions(news: NewsItem, currentContent: string, type: string) {
  const model = "gemini-3-flash-preview";
  let prompt = "";

  if (type === 'title') {
    prompt = `Gerer 5 sugestões de títulos jornalísticos impactantes e neutros para uma checagem de fatos baseada na notícia: "${news.title}". A etiqueta de checagem é: "${news.reportStructure?.label}". Retorne apenas a melhor sugestão única.`;
  } else if (type === 'lead') {
    prompt = `Escreva um lead jornalístico (primeiro parágrafo) para uma matéria de checagem de fatos sobre: "${news.title}". Use o conteúdo atual se houver: "${currentContent}". Seja direto, use a pirâmide invertida. Retorne apenas o texto do lead.`;
  } else if (type === 'summarize') {
    prompt = `Resuma o parecer de checagem da notícia "${news.title}" em um formato narrativo para um artigo. O resultado da checagem foi: "${news.reportStructure?.label}". O resumo atual é: "${news.reportStructure?.summary}". Retorne um texto estruturado para publicação.`;
  }

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
