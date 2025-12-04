
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResults {
  poseLandmarks: Landmark[];
  segmentationMask?: ImageBitmap;
}

// The structure Gemini will generate to style our character
export interface CharacterStyle {
  name: string;
  backgroundColor: string;
  headType: 'circle' | 'square' | 'robot' | 'emoji';
  headColor: string;
  headEmoji?: string; // If headType is emoji
  
  // New facial features
  faceStyle?: 'none' | 'smile' | 'cool' | 'surprised'; 
  
  // Torso & Clothing
  torsoColor: string; // Primary torso color (or shirt)
  torsoType?: 'solid' | 'shirt_pants'; // Whether to split the torso
  torsoSecondaryColor?: string; // Pants color if shirt_pants
  
  // Limbs
  limbColor: string; // Skin/Base color
  sleeveColor?: string; // Upper arm color (t-shirt effect)
  
  // Joints/Extremities
  jointColor: string; // Elbow/Knee color
  shoeColor?: string; // Specific color for feet
  
  // Custom Image Upload
  imageOverlay?: string; // Data URL of uploaded image
  imageMode?: 'head' | 'torso'; // Where to apply the image
  
  strokeWidth: number;
  glowEffect: boolean;
  description: string;
}

export enum GameState {
  IDLE,
  LOADING_MODEL,
  ACTIVE,
  ERROR
}
