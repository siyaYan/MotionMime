import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as mpPose from '@mediapipe/pose';
import * as cam from '@mediapipe/camera_utils';
import { PoseResults } from '../types';

interface PoseDetectorProps {
  onPoseUpdate: (results: PoseResults) => void;
  isActive: boolean;
}

const PoseDetector: React.FC<PoseDetectorProps> = ({ onPoseUpdate, isActive }) => {
  const webcamRef = useRef<Webcam>(null);
  const cameraRef = useRef<cam.Camera | null>(null);
  const poseRef = useRef<any>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    // MediaPipe modules loaded via CDN often behave differently than Node packages.
    // We check for default exports or direct properties to locate the Pose class.
    const PoseModule = (mpPose as any).default || mpPose;
    const PoseClass = PoseModule.Pose || (window as any).Pose;

    if (!PoseClass) {
      console.error("MediaPipe Pose class could not be found in the imported module.");
      return;
    }

    const pose = new PoseClass({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults((results: any) => {
      onPoseUpdate({
        poseLandmarks: results.poseLandmarks,
      });
      if (!modelLoaded) setModelLoaded(true);
    });

    poseRef.current = pose;

    return () => {
      pose.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserMedia = useCallback(() => {
    if (webcamRef.current && webcamRef.current.video && poseRef.current && !cameraRef.current) {
      // Resolve Camera Utils
      const CamModule = (cam as any).default || cam;
      const CameraClass = CamModule.Camera;

      if (!CameraClass) {
          console.error("MediaPipe Camera class not found");
          return;
      }

      const camera = new CameraClass(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video && poseRef.current) {
            await poseRef.current.send({ image: webcamRef.current.video });
          }
        },
        width: 640,
        height: 480,
      });

      camera.start();
      cameraRef.current = camera;
    }
  }, []);

  return (
    <div className="relative">
      <Webcam
        ref={webcamRef}
        mirrored={true}
        audio={false}
        width={320}
        height={240}
        className={`rounded-lg opacity-80 border-2 border-green-500 transition-opacity ${isActive ? 'block' : 'hidden'}`}
        screenshotFormat="image/jpeg"
        onUserMedia={handleUserMedia}
      />
      {!modelLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white rounded-lg">
          <span className="animate-pulse">Loading Pose Model...</span>
        </div>
      )}
    </div>
  );
};

export default PoseDetector;