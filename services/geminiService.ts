import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize Gemini
// Note: We create a new instance per call if needed, or reuse one.
// Since the prompt instructs to use new instance or specific pattern, we stick to the singleton pattern where appropriate
// but verify key existence.

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> => {
  if (!apiKey) {
    console.error("API Key is missing");
    return "Error: API Key missing.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // We use gemini-3-flash-preview for fast, cost-effective translation
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      Act as a professional translator.
      Translate the following text from ${sourceLang} to ${targetLang}.
      
      Input Text: "${text}"
      
      Rules:
      1. Return ONLY the translated text.
      2. Do not add any explanations, notes, or quotes.
      3. Maintain the original tone and sentiment.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Translation error:", error);
    return "Translation failed. Please try again.";
  }
};
