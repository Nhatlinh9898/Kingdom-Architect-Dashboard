
import { GoogleGenAI, Type } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateChapterLore(ageName: string, alignment: string) {
  const prompt = `Write a short, epic intro for a new chapter in an empire's history called "The ${ageName} Era". The empire follows a ${alignment} path. Limit to 3 sentences.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "A new era begins under the shadow of the old world.";
  }
}

export async function generateHeroSaga(level: number, battles: number) {
  const prompt = `Write a 1-sentence legendary title for a Level ${level} hero who has won ${battles} battles.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "The Undefeated Guardian of the Realm.";
  }
}

export async function discoverArtifact() {
  const prompt = "Generate a unique fantasy artifact name, description, rarity (Common, Rare, Legendary), and a bonus value (5-50). Output as JSON.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            rarity: { type: Type.STRING, enum: ["Common", "Rare", "Legendary"] },
            bonusType: { type: Type.STRING, enum: ["Income", "Power", "Defense"] },
            bonusValue: { type: Type.NUMBER }
          },
          required: ["name", "description", "rarity", "bonusType", "bonusValue"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { name: "Ancient Relic", description: "Unknown origin.", rarity: "Common", bonusType: "Power", bonusValue: 5 };
  }
}

export async function generateWorldEvent() {
  const prompt = "Generate a short name and description for a world event in a strategy game. Output as JSON.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            effect: { type: Type.STRING }
          },
          required: ["name", "effect"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { name: "Quiet Peace", effect: "No active modifiers." };
  }
}

export async function chatWithAdvisor(history: Message[], message: string) {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
    config: {
      systemInstruction: "You are the Grand Vizier. You help the player build an empire. Be formal, wise, and slightly manipulative if the player is a Conqueror.",
    },
  });
  try {
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    return "The stars are obscured, my liege. I cannot see the path clearly.";
  }
}
