// src/utils/geminiClient.ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Replace with your actual API Key
const API_KEY = "AIzaSyB1XtHUH2l9wrcWJb8KaPMfUnSguNitjVM"; 
const genAI = new GoogleGenerativeAI(API_KEY);

const responseSchema = {
  description: "List of multiple choice questions",
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING },
          options: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            minItems: 4,
            maxItems: 4,
          },
          correctAnswer: { 
            type: SchemaType.NUMBER,
            description: "Zero-based index of the correct answer (0-3)"
          },
        },
        required: ["question", "options", "correctAnswer"],
      },
    },
  },
  required: ["questions"],
};

export async function generateQuestionsWithGemini(
  subject: string, 
  chapter: string, 
  count: number = 5
) {
  try {
    // FIX: Using 'gemini-2.5-flash', the current stable 2026 model.
    // We must use 'v1beta' for responseSchema support.
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
    }, { apiVersion: "v1beta" });

    const prompt = `Generate exactly ${count} MCQs for Subject: ${subject}, Topic: ${chapter}. Ensure options are clear and only one is correct.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const response = await result.response;
    const data = JSON.parse(response.text());
    return data.questions;

  } catch (error: any) {
    console.error("Gemini SDK Error:", error);

    // Handle the 429 Rate Limit error gracefully
    if (error.message?.includes("429")) {
      throw new Error("AI is currently busy (Rate Limit). Please wait 30-60 seconds before trying again.");
    }

    throw new Error(error.message || "Failed to generate questions");
  }
}