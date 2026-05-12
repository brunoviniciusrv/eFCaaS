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
