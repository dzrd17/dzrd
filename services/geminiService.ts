
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select an API key.");
  }
  // Create a new instance every time to use the most up-to-date key from the environment
  return new GoogleGenAI({ apiKey });
};

export interface AnalysisResult {
  result: any;
  usage: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export const analyzeImageAttribute = async (
  imageBase64: string,
  prompt: string
): Promise<AnalysisResult> => {
  try {
    const ai = getAiClient();
    
    // Extract actual mime type from data URI if present
    const mimeTypeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    
    // Clean base64 string to remove the data URI prefix for the API call
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            },
            {
              text: `${prompt} \n\n Output strictly valid JSON. Do not include any text before or after the JSON block. Do not use markdown backticks.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };
    
    if (!text) throw new Error("No response from Gemini");

    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON", text);
      // Robust fallback cleanup for non-compliant model outputs
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Model returned invalid JSON format");
      }
    }

    return {
      result: parsedResult,
      usage: {
        promptTokenCount: usage.promptTokenCount || 0,
        candidatesTokenCount: usage.candidatesTokenCount || 0,
        totalTokenCount: usage.totalTokenCount || 0,
      }
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
