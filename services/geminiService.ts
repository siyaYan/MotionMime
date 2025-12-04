import { GoogleGenAI, Type } from "@google/genai";
import { CharacterStyle } from "../types";

export const generateCharacterStyle = async (prompt: string): Promise<CharacterStyle> => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) {
    throw new Error("API Key is missing. Please select one via the UI.");
  }

  // Create instance with the current key
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a visual style configuration for a 2D cartoon puppet based on this description: "${prompt}". 
      
      CRITICAL INSTRUCTIONS FOR CARTOON LOOK:
      - If the user asks for a specific character (like SpongeBob), match the specific clothing colors (e.g., white shirt, brown pants).
      - Use 'torsoType': 'shirt_pants' to simulate clothing.
      - Use 'sleeveColor' to simulate t-shirts or sleeves.
      - Use 'shoeColor' for footwear.
      - Choose a 'faceStyle' that matches the emotion.
      
      Return a JSON object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A creative name for this character style" },
            backgroundColor: { type: Type.STRING, description: "Hex code for the background canvas color" },
            
            // Head
            headType: { type: Type.STRING, enum: ["circle", "square", "robot", "emoji"], description: "The shape of the head" },
            headColor: { type: Type.STRING, description: "Hex code for head fill" },
            headEmoji: { type: Type.STRING, description: "A single emoji char if headType is emoji" },
            faceStyle: { type: Type.STRING, enum: ["none", "smile", "cool", "surprised"], description: "The style of face to draw on the head" },

            // Body
            torsoColor: { type: Type.STRING, description: "Hex code for torso (or shirt) color" },
            torsoType: { type: Type.STRING, enum: ["solid", "shirt_pants"], description: "If 'shirt_pants', splits torso vertically" },
            torsoSecondaryColor: { type: Type.STRING, description: "Hex code for pants if torsoType is shirt_pants" },
            
            // Limbs
            limbColor: { type: Type.STRING, description: "Hex code for arm and leg skin/base color" },
            sleeveColor: { type: Type.STRING, description: "Hex code for upper arm color (sleeves)" },
            jointColor: { type: Type.STRING, description: "Hex code for joint circles" },
            shoeColor: { type: Type.STRING, description: "Hex code for feet/shoes" },
            
            strokeWidth: { type: Type.NUMBER, description: "Line thickness (integer 2-15)" },
            glowEffect: { type: Type.BOOLEAN, description: "Whether to apply a neon glow shadow" },
            description: { type: Type.STRING, description: "Short description of the generated style" },
          },
          required: ["name", "backgroundColor", "headType", "headColor", "torsoColor", "limbColor", "jointColor", "strokeWidth", "glowEffect", "description"],
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CharacterStyle;
    }
    throw new Error("No JSON response received");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};