import { CharacterStyle } from './types';

// MediaPipe Pose Landmark Indices
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

export const CONNECTIONS = [
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  // Arms
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  // Legs
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
];

export const PRESET_CHARACTERS: CharacterStyle[] = [
  {
    name: "Neon Striker",
    backgroundColor: "#0f172a",
    headType: "circle",
    headColor: "#38bdf8",
    faceStyle: "cool",
    torsoColor: "#0284c7",
    torsoType: "solid",
    limbColor: "#0ea5e9",
    jointColor: "#e0f2fe",
    strokeWidth: 4,
    glowEffect: true,
    description: "A futuristic glowing agent."
  },
  {
    name: "Rusty Mech",
    backgroundColor: "#292524",
    headType: "robot",
    headColor: "#a8a29e",
    torsoColor: "#ea580c",
    torsoType: "shirt_pants",
    torsoSecondaryColor: "#44403c",
    limbColor: "#78716c",
    jointColor: "#fcd34d",
    shoeColor: "#1c1917",
    strokeWidth: 6,
    glowEffect: false,
    description: "Heavy industrial loader bot."
  },
  {
    name: "Pumpkin King",
    backgroundColor: "#2a0a18",
    headType: "emoji",
    headColor: "#fb923c",
    headEmoji: "🎃",
    torsoColor: "#65a30d",
    torsoType: "shirt_pants",
    torsoSecondaryColor: "#3f2c22", // Brown pants
    limbColor: "#84cc16",
    jointColor: "#ea580c",
    strokeWidth: 5,
    glowEffect: true,
    description: "Spooky seasonal vibes."
  }
];

export const DEFAULT_CHARACTER = PRESET_CHARACTERS[0];