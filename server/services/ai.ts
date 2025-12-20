import { GoogleGenerativeAI, Part } from "@google/generative-ai";
// @ts-ignore
import pdfParse from "pdf-parse";

// Initialize Gemini
// User provided API key 'div' in the prompt, but we should prioritize the environment variable.
const apiKey = process.env.GEMINI_API_KEY || "div";
const genAI = new GoogleGenerativeAI(apiKey);

// Use gemini-1.5-flash as it is multimodal and fast
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

export async function summarizeText(text: string): Promise<string> {
  try {
    const prompt = `Please summarize the following text into a concise study note:\n\n${text}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error summarizing text:", error);
    throw new Error("Failed to generate summary");
  }
}

export async function chatWithAI(
  history: { role: "user" | "model"; parts: string | Part[] }[],
  message: string,
  imageData?: { buffer: Buffer; mimeType: string },
  systemInstruction?: string
): Promise<string> {
  try {
    // If there is a system instruction, we can't easily pass it to startChat in older SDK versions 
    // or without specific model config, but gemini-1.5-flash supports systemInstruction in getGenerativeModel.
    // For simplicity, we'll prepend it to the first message or history if possible, 
    // but here we initialized the model globally. 
    // To support dynamic system instructions (prompts), we might need to re-init model or prepend context.
    
    let chatModel = model;
    if (systemInstruction) {
        chatModel = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction
        });
    }

    const chat = chatModel.startChat({
      history: history.map(h => ({
        role: h.role,
        parts: typeof h.parts === 'string' ? [{ text: h.parts }] : h.parts,
      })),
    });

    let parts: Part[] = [{ text: message }];

    if (imageData) {
      parts.push({
        inlineData: {
          data: imageData.buffer.toString("base64"),
          mimeType: imageData.mimeType,
        },
      });
    }

    const result = await chat.sendMessage(parts);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in AI chat:", error);
    throw new Error("Failed to generate chat response");
  }
}
