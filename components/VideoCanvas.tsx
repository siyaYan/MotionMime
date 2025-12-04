import React, { useRef, useEffect } from 'react';
import { PoseResults, CharacterStyle } from '../types';
import { POSE_LANDMARKS } from '../constants';

interface VideoCanvasProps {
  poseData: PoseResults | null;
  characterStyle: CharacterStyle;
  width: number;
  height: number;
}

const VideoCanvas: React.FC<VideoCanvasProps> = ({ poseData, characterStyle, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const poseDataRef = useRef<PoseResults | null>(poseData);

  useEffect(() => {
    poseDataRef.current = poseData;
  }, [poseData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // 1. Clear & Background
      ctx.fillStyle = characterStyle.backgroundColor;
      ctx.fillRect(0, 0, width, height);

      const currentPose = poseDataRef.current;
      const landmarks = currentPose?.poseLandmarks;

      if (!landmarks) {
        // Idle Screen
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "20px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText("Stand back to activate Motion Capture", width / 2, height / 2);
        requestRef.current = requestAnimationFrame(render);
        return;
      }

      // 2. Helper Functions
      const getPos = (index: number) => ({
        x: (1 - landmarks[index].x) * width, // Mirroring the X coordinate
        y: landmarks[index].y * height,
        v: landmarks[index].visibility ?? 0
      });

      // Calculate Scale Unit (based on shoulder width)
      // This allows the character to become "thicker" when close to camera
      const leftShoulder = getPos(POSE_LANDMARKS.LEFT_SHOULDER);
      const rightShoulder = getPos(POSE_LANDMARKS.RIGHT_SHOULDER);
      
      const shoulderDist = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
      // Fallback scale if detection is weird
      const unit = Math.max(shoulderDist, width * 0.1); 

      // Visual Properties
      const outlineWidth = characterStyle.strokeWidth; 
      const outlineColor = 'rgba(0,0,0,0.6)'; // Dark outline for cartoon look

      // Dynamic Pulse for Glow
      let glowBlur = 0;
      if (characterStyle.glowEffect) {
        const time = Date.now();
        glowBlur = 20 + 10 * Math.sin(time * 0.005);
      }

      /**
       * Draws a "Sausage" limb (Line with Round Cap)
       * Draws twice: once for outline, once for fill.
       */
      const drawLimb = (idxA: number, idxB: number, color: string, thicknessScale: number = 1) => {
        const start = getPos(idxA);
        const end = getPos(idxB);
        
        if (start.v < 0.5 || end.v < 0.5) return;

        const thickness = unit * thicknessScale;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outline Pass
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = thickness + outlineWidth;
        ctx.strokeStyle = outlineColor;
        
        if (characterStyle.glowEffect) {
           ctx.shadowBlur = glowBlur;
           ctx.shadowColor = color;
        } else {
           ctx.shadowBlur = 0;
        }
        ctx.stroke();

        // Fill Pass
        ctx.shadowBlur = 0; // Don't blur the fill, only the glow/outline
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineWidth = thickness;
        ctx.strokeStyle = color;
        ctx.stroke();
      };

      /**
       * Draws a circle at a specific joint (Hands/Feet)
       */
      const drawExtremity = (idx: number, color: string, scale: number = 0.5) => {
        const p = getPos(idx);
        if (p.v < 0.5) return;
        const radius = (unit * scale) / 2;

        // Outline
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + outlineWidth / 2, 0, 2 * Math.PI);
        ctx.fillStyle = outlineColor;
        if (characterStyle.glowEffect) {
           ctx.shadowBlur = glowBlur;
           ctx.shadowColor = color;
        }
        ctx.fill();

        // Fill
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      };

      // 3. Rendering Order (Painter's Algorithm: Back -> Front)

      // --- Layer 1: Legs (Background) ---
      // Left Leg
      drawLimb(POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE, characterStyle.limbColor, 0.35); // Thigh
      drawLimb(POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE, characterStyle.limbColor, 0.3); // Shin
      drawExtremity(POSE_LANDMARKS.LEFT_ANKLE, characterStyle.shoeColor || characterStyle.jointColor, 0.4); // Shoe/Foot

      // Right Leg
      drawLimb(POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE, characterStyle.limbColor, 0.35);
      drawLimb(POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE, characterStyle.limbColor, 0.3);
      drawExtremity(POSE_LANDMARKS.RIGHT_ANKLE, characterStyle.shoeColor || characterStyle.jointColor, 0.4);

      // --- Layer 2: Torso (Body) ---
      const lHip = getPos(POSE_LANDMARKS.LEFT_HIP);
      const rHip = getPos(POSE_LANDMARKS.RIGHT_HIP);
      
      if (leftShoulder.v > 0.5 && rightShoulder.v > 0.5 && lHip.v > 0.5 && rHip.v > 0.5) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = outlineWidth;
        ctx.strokeStyle = outlineColor;

        if (characterStyle.glowEffect) {
           ctx.shadowBlur = glowBlur;
           ctx.shadowColor = characterStyle.torsoColor;
        }

        // Define Torso Path
        ctx.beginPath();
        ctx.moveTo(leftShoulder.x, leftShoulder.y);
        ctx.lineTo(rightShoulder.x, rightShoulder.y);
        ctx.lineTo(rHip.x, rHip.y);
        ctx.lineTo(lHip.x, lHip.y);
        ctx.closePath();
        
        // Fill - Check for Shirt/Pants Split
        if (characterStyle.torsoType === 'shirt_pants' && characterStyle.torsoSecondaryColor) {
           // Create gradient fill to simulate split
           // We approximate the waist at 60% down the torso
           const topY = Math.min(leftShoulder.y, rightShoulder.y);
           const bottomY = Math.max(lHip.y, rHip.y);
           const height = bottomY - topY;
           
           const gradient = ctx.createLinearGradient(0, topY, 0, bottomY);
           gradient.addColorStop(0, characterStyle.torsoColor);
           gradient.addColorStop(0.55, characterStyle.torsoColor); // Sharp line
           gradient.addColorStop(0.55, characterStyle.torsoSecondaryColor);
           gradient.addColorStop(1, characterStyle.torsoSecondaryColor);
           
           ctx.fillStyle = gradient;
        } else {
           ctx.fillStyle = characterStyle.torsoColor;
        }

        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow for stroke
        ctx.stroke();
      }

      // --- Layer 3: Arms (Foreground) ---
      // Left Arm
      // If sleeveColor exists, use it for the upper arm, otherwise use limbColor
      drawLimb(POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, characterStyle.sleeveColor || characterStyle.limbColor, 0.3); 
      drawLimb(POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST, characterStyle.limbColor, 0.25); 
      drawExtremity(POSE_LANDMARKS.LEFT_WRIST, characterStyle.jointColor, 0.35); // Hand/Glove

      // Right Arm
      drawLimb(POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW, characterStyle.sleeveColor || characterStyle.limbColor, 0.3);
      drawLimb(POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST, characterStyle.limbColor, 0.25);
      drawExtremity(POSE_LANDMARKS.RIGHT_WRIST, characterStyle.jointColor, 0.35);

      // --- Layer 4: Head (Top) ---
      const nose = getPos(POSE_LANDMARKS.NOSE);
      const leftEar = getPos(POSE_LANDMARKS.LEFT_EAR);
      const rightEar = getPos(POSE_LANDMARKS.RIGHT_EAR);

      if (nose.v > 0.5) {
         // Calculate head size
         const earDist = Math.hypot(leftEar.x - rightEar.x, leftEar.y - rightEar.y);
         const headSize = Math.max(earDist * 1.8, unit * 0.6); // Min size relative to body
         
         ctx.fillStyle = characterStyle.headColor;
         ctx.lineWidth = outlineWidth;
         ctx.strokeStyle = outlineColor;

         if (characterStyle.glowEffect) {
            ctx.shadowBlur = glowBlur;
            ctx.shadowColor = characterStyle.headColor;
         }

         if (characterStyle.headType === 'emoji' && characterStyle.headEmoji) {
            ctx.shadowBlur = 0; // Emojis don't render well with heavy shadow
            ctx.font = `${headSize * 2}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(characterStyle.headEmoji, nose.x, nose.y);
         } 
         else if (characterStyle.headType === 'square' || characterStyle.headType === 'robot') {
            const half = headSize / 1.5;
            ctx.beginPath();
            // Rounded Rect for head
            ctx.roundRect(nose.x - half, nose.y - half, headSize * 1.33, headSize * 1.33, 10);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.stroke();

            // Robot Eyes
            if (characterStyle.headType === 'robot') {
                ctx.fillStyle = "#000"; // Black eyes
                // Left Eye
                ctx.fillRect(nose.x - half + (headSize*0.3), nose.y - (headSize*0.1), headSize*0.2, headSize*0.1);
                // Right Eye
                ctx.fillRect(nose.x + half - (headSize*0.5), nose.y - (headSize*0.1), headSize*0.2, headSize*0.1);
            }
         } 
         else {
             // Default Circle Head
             ctx.beginPath();
             ctx.arc(nose.x, nose.y, headSize * 0.7, 0, 2 * Math.PI);
             ctx.fill();
             ctx.shadowBlur = 0;
             ctx.stroke();
         }

         // --- Face Rendering (Eyes/Mouth) ---
         // Only if not emoji and not robot (robot has its own eyes above)
         if (characterStyle.headType !== 'emoji' && characterStyle.headType !== 'robot' && characterStyle.faceStyle !== 'none') {
             const eyeOffsetX = headSize * 0.25;
             const eyeOffsetY = headSize * 0.15;
             const eyeRadius = headSize * 0.15;

             ctx.fillStyle = "white";
             ctx.strokeStyle = "black";
             ctx.lineWidth = 2;
             
             // Eyes Base
             if (characterStyle.faceStyle === 'cool') {
                ctx.fillStyle = "black";
                ctx.beginPath();
                ctx.arc(nose.x - eyeOffsetX, nose.y - eyeOffsetY, eyeRadius * 1.2, 0, Math.PI * 2);
                ctx.arc(nose.x + eyeOffsetX, nose.y - eyeOffsetY, eyeRadius * 1.2, 0, Math.PI * 2);
                ctx.fill();
                // Bridge
                ctx.beginPath();
                ctx.moveTo(nose.x - eyeOffsetX, nose.y - eyeOffsetY);
                ctx.lineTo(nose.x + eyeOffsetX, nose.y - eyeOffsetY);
                ctx.stroke();
             } else {
                // Smile or Surprised Eyes
                // Left Eye
                ctx.beginPath();
                ctx.arc(nose.x - eyeOffsetX, nose.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
                // Right Eye
                ctx.beginPath();
                ctx.arc(nose.x + eyeOffsetX, nose.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();

                // Pupils
                ctx.fillStyle = "black";
                ctx.beginPath();
                ctx.arc(nose.x - eyeOffsetX, nose.y - eyeOffsetY, eyeRadius * 0.3, 0, Math.PI * 2);
                ctx.arc(nose.x + eyeOffsetX, nose.y - eyeOffsetY, eyeRadius * 0.3, 0, Math.PI * 2);
                ctx.fill();
             }

             // Mouth
             ctx.beginPath();
             if (characterStyle.faceStyle === 'surprised') {
                 ctx.ellipse(nose.x, nose.y + headSize * 0.3, headSize * 0.1, headSize * 0.15, 0, 0, Math.PI * 2);
                 ctx.fillStyle = "black";
                 ctx.fill();
             } else {
                 // Smile
                 ctx.arc(nose.x, nose.y + headSize * 0.1, headSize * 0.35, 0.2 * Math.PI, 0.8 * Math.PI);
                 ctx.stroke();
             }
         }
      }

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [characterStyle, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="w-full h-full object-contain bg-black rounded-xl shadow-2xl border border-gray-700"
    />
  );
};

export default VideoCanvas;