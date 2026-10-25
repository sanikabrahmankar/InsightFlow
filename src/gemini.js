import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
let chatSession = null; // Stores history for iterative refinement

export async function getDataStrategy(schema, goal, isFollowUp = false, followUpPrompt = "") {
  if (!chatSession) {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-3.8-flash",
        systemInstruction: "You are an expert Data Science assistant. Output strictly valid JSON with keys: data_cleaning, pandas_code, eda_code, and scikit_learn_models. Use pd.read_excel for data loading.",
        generationConfig: { responseMimeType: "application/json" }
    });
    chatSession = model.startChat({ history: [] });
  }

  const prompt = isFollowUp ? followUpPrompt : `Goal: ${goal}\nExcel Schema: ${schema}`;
  
  try {
    const result = await chatSession.sendMessage(prompt);
    // Strip markdown formatting if Gemini hallucinates it
    const rawText = result.response.text();
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error details:", error);
    throw error;
  }
}

// Helper to reset chat when a brand new dataset is loaded
export function resetChat() {
  chatSession = null;
}