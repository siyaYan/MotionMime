import React, { useState, useEffect } from 'react';
import { FaVideo, FaVideoSlash, FaRobot, FaMagic, FaPalette, FaUserAstronaut, FaLock, FaSave, FaTrash } from 'react-icons/fa';
import PoseDetector from './components/PoseDetector';
import VideoCanvas from './components/VideoCanvas';
import { PoseResults, CharacterStyle, GameState } from './types';
import { DEFAULT_CHARACTER, PRESET_CHARACTERS } from './constants';
import { generateCharacterStyle } from './services/geminiService';

const App: React.FC = () => {
  const [poseData, setPoseData] = useState<PoseResults | null>(null);
  const [characterStyle, setCharacterStyle] = useState<CharacterStyle>(DEFAULT_CHARACTER);
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const [savedStyles, setSavedStyles] = useState<CharacterStyle[]>([]);

  // Check for API Key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      const aiStudio = (window as any).aistudio;
      if (aiStudio && aiStudio.hasSelectedApiKey) {
        const hasKey = await aiStudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        if (process.env.API_KEY) setHasApiKey(true);
      }
    };
    checkApiKey();
  }, []);

  // Load saved styles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('motionMime_savedStyles');
    if (saved) {
      try {
        setSavedStyles(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved styles");
      }
    }
  }, []);

  const handleApiKeySelection = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio && aiStudio.openSelectKey) {
      await aiStudio.openSelectKey();
      setHasApiKey(true);
      setIsDemoMode(false); 
    }
  };

  const handleEnterDemo = () => {
    setIsDemoMode(true);
  };

  const handleGenerateStyle = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const newStyle = await generateCharacterStyle(prompt);
      setCharacterStyle(newStyle);
    } catch (e) {
      alert("Failed to generate character. Please check your API key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveStyle = () => {
    // Simple check to prevent exact duplicates in succession
    const isDuplicate = savedStyles.some(s => JSON.stringify(s) === JSON.stringify(characterStyle));
    if (isDuplicate) {
        // Optionally alert user or just ignore
        return; 
    }
    const newSaved = [...savedStyles, characterStyle];
    setSavedStyles(newSaved);
    localStorage.setItem('motionMime_savedStyles', JSON.stringify(newSaved));
  };

  const handleDeleteStyle = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent activating the style while deleting
    const newSaved = savedStyles.filter((_, i) => i !== index);
    setSavedStyles(newSaved);
    localStorage.setItem('motionMime_savedStyles', JSON.stringify(newSaved));
  };

  const handlePoseUpdate = (results: PoseResults) => {
    setPoseData(results);
    if (gameState === GameState.IDLE && results.poseLandmarks) {
      setGameState(GameState.ACTIVE);
    }
  };

  // Landing Screen
  if (!hasApiKey && !isDemoMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-lg">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-purple-600 mb-4">
            MotionMime
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Transform your webcam movements into real-time cartoon animations.
          </p>
          
          <div className="grid gap-4 w-full max-w-md mx-auto">
            <button 
              onClick={handleApiKeySelection}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg flex items-center justify-center gap-3"
            >
              <FaMagic /> Connect Gemini API
            </button>
            
            <button 
              onClick={handleEnterDemo}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-3 px-8 rounded-xl transition-all flex items-center justify-center gap-3 border border-slate-600"
            >
              <FaUserAstronaut /> Try Demo (Presets Only)
            </button>
          </div>

          <p className="mt-8 text-xs text-slate-500">
            API Key required for custom AI character generation. <br/>
            Billing info: <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-400 underline">ai.google.dev</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col lg:flex-row overflow-hidden">
      
      {/* Sidebar Controls */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-800 border-r border-slate-700 z-10 shadow-xl overflow-hidden h-screen">
        <div className="p-6 flex-none">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                MotionMime
              </h1>
              <p className="text-slate-400 text-xs">Real-time Puppetry</p>
            </div>
            {!hasApiKey && (
              <button 
                onClick={handleApiKeySelection} 
                className="text-xs bg-blue-600 px-2 py-1 rounded text-white hover:bg-blue-500 transition-colors"
                title="Connect API Key to unlock GenAI"
              >
                Connect Key
              </button>
            )}
          </div>

          {/* Camera Preview */}
          <div className="space-y-2 mb-6">
             <div className="flex justify-between items-center">
               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <FaVideo /> Input Feed
               </h3>
               <button 
                 onClick={() => setShowCameraPreview(!showCameraPreview)}
                 className="text-xs text-slate-400 hover:text-white"
               >
                 {showCameraPreview ? <FaVideo /> : <FaVideoSlash />}
               </button>
             </div>
             
             <div className={`relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-600 ${!showCameraPreview ? 'h-10' : ''}`}>
               <PoseDetector onPoseUpdate={handlePoseUpdate} isActive={true} />
               {!showCameraPreview && <span className="text-xs text-gray-500">Processing Active</span>}
             </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          
          {/* Presets Section */}
          <div className="space-y-3">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
               <FaUserAstronaut /> Presets
             </h3>
             <div className="grid grid-cols-1 gap-2">
               {PRESET_CHARACTERS.map((preset, idx) => (
                 <button
                   key={idx}
                   onClick={() => setCharacterStyle(preset)}
                   className={`p-3 rounded-lg flex items-center gap-3 transition-all border ${
                     characterStyle.name === preset.name 
                       ? 'bg-slate-700 border-teal-500 shadow-md' 
                       : 'bg-slate-900 border-transparent hover:bg-slate-700'
                   }`}
                 >
                   <div 
                     className="w-8 h-8 rounded-full border border-slate-600 flex-none flex items-center justify-center text-lg"
                     style={{ backgroundColor: preset.headType === 'emoji' ? 'transparent' : preset.headColor }}
                   >
                     {preset.headType === 'emoji' ? preset.headEmoji : ''}
                   </div>
                   <div className="text-left">
                     <div className="font-semibold text-sm">{preset.name}</div>
                   </div>
                 </button>
               ))}
             </div>
          </div>

          {/* Saved Styles Section */}
          {savedStyles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <FaSave /> Saved Library
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {savedStyles.map((style, idx) => (
                  <button
                    key={`saved-${idx}`}
                    onClick={() => setCharacterStyle(style)}
                    className={`p-3 rounded-lg flex items-center justify-between gap-3 transition-all border group ${
                      JSON.stringify(characterStyle) === JSON.stringify(style)
                        ? 'bg-slate-700 border-teal-500 shadow-md' 
                        : 'bg-slate-900 border-transparent hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div 
                        className="w-8 h-8 rounded-full border border-slate-600 flex-none flex items-center justify-center text-lg"
                        style={{ backgroundColor: style.headType === 'emoji' ? 'transparent' : style.headColor }}
                      >
                        {style.headType === 'emoji' ? style.headEmoji : ''}
                      </div>
                      <div className="text-left truncate">
                        <div className="font-semibold text-sm truncate">{style.name}</div>
                      </div>
                    </div>
                    <div 
                      onClick={(e) => handleDeleteStyle(idx, e)}
                      className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <FaTrash size={12} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Generator Section */}
          <div className="space-y-3 pt-4 border-t border-slate-700 relative">
            <div className="flex items-center justify-between text-purple-400">
              <div className="flex items-center gap-2">
                <FaRobot />
                <h2 className="text-sm font-bold uppercase tracking-wider">AI Designer</h2>
              </div>
              {!hasApiKey && <FaLock className="text-slate-500" />}
            </div>
            
            <div className={`space-y-3 transition-opacity ${!hasApiKey ? 'opacity-50 pointer-events-none' : ''}`}>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe a new character (e.g., 'A pixel art zombie')"
                className="w-full h-20 bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
              />
              <button 
                onClick={handleGenerateStyle}
                disabled={isGenerating || !prompt}
                className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  isGenerating || !prompt 
                    ? 'bg-slate-700 text-slate-500' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg'
                }`}
              >
                {isGenerating ? <span className="animate-spin">⏳</span> : <FaPalette />}
                {isGenerating ? 'Generating...' : 'Generate Style'}
              </button>
            </div>

            {/* Lock Overlay for Demo Mode */}
            {!hasApiKey && (
              <div className="absolute inset-0 bg-slate-800/20 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4 rounded-lg z-20">
                <button 
                  onClick={handleApiKeySelection}
                  className="bg-slate-900 text-white text-xs px-4 py-2 rounded-full border border-slate-600 shadow hover:bg-slate-800 transition-colors"
                >
                  Unlock with API Key
                </button>
              </div>
            )}
          </div>
          
          {/* Current Style Info */}
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 space-y-1">
             <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase">Active Style</h3>
                  <p className="font-bold text-sm text-teal-400">{characterStyle.name}</p>
               </div>
               <button 
                 onClick={handleSaveStyle}
                 className="text-slate-400 hover:text-teal-400 transition-colors p-1"
                 title="Save Current Style"
               >
                 <FaSave size={16} />
               </button>
             </div>
             <p className="text-xs text-slate-500">{characterStyle.description}</p>
          </div>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 bg-black relative flex items-center justify-center p-4 lg:p-10 overflow-hidden">
        <div className="w-full h-full relative max-w-6xl aspect-video mx-auto">
          <VideoCanvas 
            poseData={poseData} 
            characterStyle={characterStyle}
            width={1280}
            height={720}
          />
          
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-mono text-green-400">
            {gameState === GameState.IDLE ? "WAITING FOR POSE..." : "● LIVE TRACKING"}
          </div>
        </div>
      </div>

    </div>
  );
};

export default App;