import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, Modality, LiveServerMessage } from "@google/genai";
import { Send, Bot, Sparkles, Eraser, User, Info, WifiOff, ArrowRight, Mic, PhoneOff, Headphones, Globe } from 'lucide-react';
import { TuningResult, NoteDefinition } from '../types';
import { OfflineAgent } from '../utils/offlineAgent';
import { arrayBufferToBase64, convertFloat32ToInt16, base64ToUint8Array, decodeAudioData, downsampleBuffer } from '../utils/audioUtils';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface Props {
  tuningResult: TuningResult | null;
  targetNote: NoteDefinition | null;
  scaleName: string;
  isActive: boolean;
  theme: 'dark' | 'light';
}

const SUGGESTIONS = [
  "How do I start tuning?",
  "My note is too Sharp (+)",
  "My note is too Flat (-)",
  "What is 432Hz vs 440Hz?",
  "How do I fix rust?",
];

const AITuningAssistant: React.FC<Props> = ({ tuningResult, targetNote, scaleName, isActive, theme }) => {
  // --- Text Chat State ---
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: "Greetings. I am Aura, your tuning specialist. I can guide you to the Tuner to check your notes, or help you with maintenance advice." }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // --- Voice Mode State ---
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [micVolume, setMicVolume] = useState(0); // 0-1 for visualizer
  const [aiVolume, setAiVolume] = useState(0);   // 0-1 for visualizer
  
  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Voice Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // --- Helpers ---
  // Allow a custom proxy URL via env var to bypass VPN requirements in restricted regions
  // usage: REACT_APP_GEMINI_PROXY_URL="https://my-worker.com/v1beta"
  const getClientOptions = () => {
     const options: any = { apiKey: process.env.API_KEY };
     if (process.env.REACT_APP_GEMINI_PROXY_URL) {
         options.baseUrl = process.env.REACT_APP_GEMINI_PROXY_URL;
     }
     return options;
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
        setIsOffline(true);
        if (isVoiceMode) toggleVoiceMode(); // Auto-cut voice if net drops
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isVoiceMode]);

  // Scroll to bottom on text message
  useEffect(() => {
    if (isActive && !isVoiceMode) {
      setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isActive, isVoiceMode]);

  // Init Text Chat
  useEffect(() => {
    try {
        if (!process.env.API_KEY) return;
        
        const ai = new GoogleGenAI(getClientOptions());
        const chat = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: `You are SpaceTuner Pro's expert AI consultant for handpan, pantam, and tongue drum makers. 
            
            Role: Friendly, patient, and knowledgeable teacher.
            
            App Navigation Guidance:
            - **Tuner Tab** (Dashboard icon): Direct the user here to check if their instrument is out of tune. Explain that the meter shows if a note is Sharp (+) or Flat (-).
            - **Tone Gen Tab** (Wave icon): Direct the user here to play reference frequencies/drones.
            - **Guide Tab** (Book icon): Tutorials and manuals.

            If a user asks "Is my instrument out of tune?" or "How do I check my tuning?", guide them to the Tuner Tab and instruct them to strike the note clearly.
            
            Knowledge Base:
            - Handpans: Tuned by hammering. Compressive stress (hammering inside/center) raises pitch. Expansive stress (hammering outside/ring) lowers pitch.
            - Tongue Drums: Tuned by adding weight (magnets/solder/beeswax) to lower pitch (flatten), or filing/removing material to raise pitch (sharpen).
            - Physics: Sharp means frequency is too high. Flat means frequency is too low.
            `,
          },
        });
        setChatSession(chat);
    } catch (e) {
        console.error("Failed to init AI Text", e);
    }
  }, []);

  // --- Voice Mode Logic ---

  const startVoiceSession = async () => {
      if (isOffline) {
          alert("Voice mode requires an active internet connection.");
          return;
      }
      if (!process.env.API_KEY) {
          alert("API Key missing.");
          return;
      }

      setIsVoiceConnected(false);
      
      try {
          const ai = new GoogleGenAI(getClientOptions());
          
          // 1. Audio Contexts - Handle Native Mobile Sample Rates
          // We let the OS decide the sample rate for the context, then we resample.
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const inputCtx = new AudioCtx(); // Usually 48000 or 44100 on mobile
          const outputCtx = new AudioCtx({ sampleRate: 24000 }); // Gemini Output is 24k

          inputContextRef.current = inputCtx;
          audioContextRef.current = outputCtx;
          nextStartTimeRef.current = 0;

          // 2. Microphone Stream
          // We don't force sampleRate here as it can cause failure on some mobile browsers
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                autoGainControl: true,
                noiseSuppression: true
            } 
          });
          
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          
          // Connect graph for mic
          source.connect(processor);
          processor.connect(inputCtx.destination);
          
          // Mic Visualizer (Simple RMS)
          const micAnalyser = inputCtx.createAnalyser();
          source.connect(micAnalyser);
          const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);
          const updateMicVol = () => {
             if (!inputContextRef.current) return;
             micAnalyser.getByteFrequencyData(dataArray);
             let sum = 0;
             for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
             const avg = sum / dataArray.length;
             setMicVolume(avg / 128); 
             requestAnimationFrame(updateMicVol);
          };
          updateMicVol();

          // 3. Connect to Gemini Live
          const sessionPromise = ai.live.connect({
              model: 'gemini-2.5-flash-native-audio-preview-12-2025',
              callbacks: {
                  onopen: () => {
                      console.log("Voice Session Opened");
                      setIsVoiceConnected(true);
                      
                      processor.onaudioprocess = (e) => {
                          const inputData = e.inputBuffer.getChannelData(0);
                          const currentSampleRate = inputCtx.sampleRate;
                          
                          // VITAL FOR MOBILE: Downsample from 44.1k/48k to 16k
                          const downsampled = downsampleBuffer(inputData, currentSampleRate, 16000);
                          
                          const int16 = convertFloat32ToInt16(downsampled);
                          const base64 = arrayBufferToBase64(int16.buffer);
                          
                          sessionPromise.then(session => {
                              session.sendRealtimeInput({
                                  media: {
                                      mimeType: 'audio/pcm;rate=16000',
                                      data: base64
                                  }
                              });
                          });
                      };
                  },
                  onmessage: async (msg: LiveServerMessage) => {
                      const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                      if (base64Audio && outputCtx) {
                          // Mobile: Ensure context is running (it can suspend automatically)
                          if (outputCtx.state === 'suspended') await outputCtx.resume();

                          // Visualizer pulse for AI
                          setAiVolume(0.8);
                          setTimeout(() => setAiVolume(0), 300);

                          const audioBytes = base64ToUint8Array(base64Audio);
                          const audioBuffer = await decodeAudioData(audioBytes, outputCtx, 24000, 1);
                          
                          const source = outputCtx.createBufferSource();
                          source.buffer = audioBuffer;
                          source.connect(outputCtx.destination);
                          
                          // Schedule playback
                          const now = outputCtx.currentTime;
                          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                          source.start(nextStartTimeRef.current);
                          nextStartTimeRef.current += audioBuffer.duration;
                          
                          sourcesRef.current.add(source);
                          source.onended = () => sourcesRef.current.delete(source);
                      }
                  },
                  onclose: () => {
                      console.log("Voice Session Closed");
                      stopVoiceSession();
                  },
                  onerror: (err) => {
                      console.error("Voice Error", err);
                      // Don't auto-stop for every error, but log it
                  }
              },
              config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                  },
                  systemInstruction: `You are Aura, a professional AI tuning specialist for SpaceTuner Pro.
                  You are young, professional, gentle, warm, and friendly. You speak with emotion and care.

                  Mission: Welcome the user to SpaceTuner Pro's professional handpan and tongue drum tuning services.

                  Navigation Guidance:
                  - If the user asks how to check if their instrument is in tune, guide them to the "Tuner" tab (bottom left). Explain that they should strike the note and watch the meter.
                  - If they want to hear a reference sound, guide them to the "Tone Gen" tab.

                  Knowledge Base:
                  - Sharp notes need to be lowered (flattened).
                  - Flat notes need to be raised (sharpened).
                  
                  Keep responses concise, conversational, and helpful.`,
              }
          });
          
          sessionPromiseRef.current = sessionPromise;
      } catch (err) {
          console.error("Failed to start voice", err);
          stopVoiceSession();
          alert("Connection failed. If you are in a restricted region, please configure a Proxy URL or enable VPN.");
      }
  };

  const stopVoiceSession = () => {
      setIsVoiceConnected(false);
      
      // Cleanup Audio Contexts
      inputContextRef.current?.close();
      audioContextRef.current?.close();
      inputContextRef.current = null;
      audioContextRef.current = null;
      
      // Stop Audio Sources
      sourcesRef.current.forEach(s => s.stop());
      sourcesRef.current.clear();
      
      // Close Session
      if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then(s => {
             // Try catch block for safe closing
             try { s.close(); } catch(e){}
          });
          sessionPromiseRef.current = null;
      }
      setIsVoiceMode(false);
  };

  const toggleVoiceMode = () => {
      if (isVoiceMode) {
          stopVoiceSession();
      } else {
          setIsVoiceMode(true);
          startVoiceSession();
      }
  };


  // --- Text Chat Handling ---

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    if (isOffline) {
        const offlineResponse = OfflineAgent.chat(userMsg.text, tuningResult ? {
            note: tuningResult.closestNote,
            cents: tuningResult.centsOff
        } : undefined);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: offlineResponse }]);
            setIsLoading(false);
        }, 600); 
        return;
    }

    if (!chatSession) {
         setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: "AI initialization failed. Please reload." }]);
         setIsLoading(false);
         return;
    }

    let context = "";
    if (tuningResult) {
        context = `[Context: Current Input=${tuningResult.closestNote}, Cents=${tuningResult.centsOff.toFixed(1)}, Target=${targetNote ? targetNote.name + targetNote.octave : 'Auto'}] `;
    }

    try {
      const result = await chatSession.sendMessage({ message: context + userMsg.text });
      const responseText = result.text || "The spirits are silent...";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: "Connection interrupted. Switching to offline mode logic." }]);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(inputText);
  const clearChat = () => setMessages([{ id: 'init', role: 'model', text: "Chat cleared. How can I help?" }]);

  // Styles
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const headerColor = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-800';
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const modelBubbleColor = isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-700 border-slate-200 shadow-sm';
  const inputAreaColor = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const inputBg = isDark ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500';

  return (
    <div className={`flex flex-col h-full ${bgColor} transition-colors duration-300 relative overflow-hidden`}>
      
      {/* Header */}
      <div className={`flex-none flex items-center justify-between p-4 border-b backdrop-blur z-20 shadow-sm ${headerColor}`}>
         <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${isOffline ? 'bg-slate-700' : isVoiceMode ? 'bg-emerald-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'}`}>
                 {isOffline ? <WifiOff size={20} className="text-slate-400" /> : isVoiceMode ? <Headphones size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
             </div>
             <div>
                <h3 className={`font-tech font-bold leading-tight ${textColor}`}>{isVoiceMode ? 'Live Agent' : 'AI Assistant'}</h3>
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : isVoiceMode && isVoiceConnected ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                    <span className={`text-[10px] uppercase tracking-wider ${subTextColor}`}>
                       {isOffline ? 'Offline' : isVoiceMode ? (isVoiceConnected ? 'Connected' : 'Connecting...') : 'Online'}
                    </span>
                </div>
             </div>
         </div>
         <div className="flex items-center gap-2">
            {!isOffline ? (
                <button 
                    onClick={toggleVoiceMode} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isVoiceMode ? 'bg-rose-500 border-rose-400 text-white' : isDark ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'}`}
                >
                    {isVoiceMode ? <PhoneOff size={14} /> : <Mic size={14} />}
                    {isVoiceMode ? 'End Call' : 'Voice Mode'}
                </button>
            ) : (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md">
                   <WifiOff size={12} className="text-amber-500"/>
                   <span className="text-[10px] text-amber-500 font-bold">Voice Unavailable</span>
                </div>
            )}
            {!isVoiceMode && (
                <button onClick={clearChat} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-500 hover:text-indigo-600 bg-slate-100'}`}>
                    <Eraser size={18} />
                </button>
            )}
         </div>
      </div>

      {/* Voice Visualizer Overlay */}
      {isVoiceMode && (
          <div className="absolute inset-0 top-[73px] z-10 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
             <div className="relative">
                 {/* Outer Glow (AI Output) */}
                 <div 
                    className="absolute inset-0 rounded-full bg-indigo-500/30 blur-3xl transition-transform duration-100"
                    style={{ transform: `scale(${1 + aiVolume * 3})` }}
                 ></div>
                 
                 {/* Inner Glow (Mic Input) */}
                 <div 
                    className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl transition-transform duration-75"
                    style={{ transform: `scale(${1 + micVolume * 4})` }}
                 ></div>

                 {/* Core Orb */}
                 <div className="relative w-48 h-48 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center shadow-2xl overflow-hidden">
                     {/* Dynamic Waves */}
                     <div className={`absolute w-full h-full bg-gradient-to-t from-indigo-600/20 to-transparent transition-opacity duration-300 ${isVoiceConnected ? 'opacity-100' : 'opacity-0'}`}></div>
                     
                     <div className="text-center z-10 space-y-2">
                        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${isVoiceConnected ? 'bg-emerald-500 text-white shadow-[0_0_20px_#10b981]' : 'bg-slate-800 text-slate-500'}`}>
                           <Mic size={32} className={isVoiceConnected ? 'animate-pulse' : ''} />
                        </div>
                        <div className="font-tech text-slate-300 text-sm tracking-widest">
                            {isVoiceConnected ? 'LISTENING' : 'CONNECTING'}
                        </div>
                     </div>
                 </div>
             </div>
             
             <p className="mt-12 text-slate-400 text-center max-w-xs text-sm">
                 Speak naturally. Aura is listening...
             </p>
             
             {/* Simple Hints */}
             <div className="mt-8 flex gap-2">
                 {["Why is my D3 sharp?", "What scale is this?", "Help me tune"].map(hint => (
                     <span key={hint} className="px-3 py-1 rounded-full border border-slate-700 bg-slate-800/50 text-xs text-slate-500">
                         {hint}
                     </span>
                 ))}
             </div>
          </div>
      )}

      {/* Text Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 overscroll-contain pb-24">
        {/* Info Banner */}
        <div className={`flex gap-2 p-3 rounded-lg text-xs ${isDark ? 'bg-indigo-900/20 text-indigo-300 border border-indigo-900/50' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
            {isOffline ? <WifiOff size={16} className="flex-shrink-0 mt-0.5" /> : <Globe size={16} className="flex-shrink-0 mt-0.5" />}
            <p>
              {isOffline 
                ? "Offline Mode Active. Voice Chat is disabled, but I can still help with basic tuning and maintenance questions." 
                : process.env.REACT_APP_GEMINI_PROXY_URL ? "Connected via Proxy. Voice and Text Chat Online." : `Connected to Gemini Cloud. I can help you analyze frequency ratios for ${scaleName}.`}
            </p>
        </div>

        {messages.map((msg) => (
           <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
              <div className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 shadow-sm ${msg.role === 'user' ? (isDark ? 'bg-slate-700' : 'bg-slate-200') : (isOffline ? 'bg-slate-700' : 'bg-indigo-100')}`}>
                      {msg.role === 'user' ? <User size={14} className={isDark ? 'text-slate-300' : 'text-slate-600'}/> : (isOffline ? <WifiOff size={14} className="text-slate-400"/> : <Sparkles size={14} className="text-indigo-600"/>)}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed border ${
                      msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none border-transparent shadow-md' 
                      : `${modelBubbleColor} rounded-tl-none`
                  }`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
              </div>
           </div>
        ))}

        {isLoading && (
            <div className="flex justify-start gap-3 animate-pulse">
               <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${isOffline ? 'bg-slate-700' : 'bg-indigo-100'}`}>
                   {isOffline ? <WifiOff size={14} className="text-slate-400"/> : <Sparkles size={14} className="text-indigo-600"/>}
               </div>
               <div className={`rounded-2xl rounded-tl-none px-4 py-3 border flex gap-1.5 items-center h-11 ${modelBubbleColor}`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-100 ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
                  <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-200 ${isDark ? 'bg-slate-500' : 'bg-slate-400'}`}></div>
               </div>
            </div>
        )}

        {!isLoading && messages.length <= 2 && (
            <div className="flex flex-col gap-3 mt-4 animate-in fade-in duration-500 delay-300">
               <div className={`text-[10px] font-bold uppercase tracking-widest pl-12 ${subTextColor}`}>Suggested Topics</div>
               <div className="pl-11 grid grid-cols-1 gap-2">
                  {SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(suggestion)}
                      className={`text-left text-sm px-4 py-3 rounded-xl border transition-all flex items-center justify-between group ${
                        isDark 
                          ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white' 
                          : 'bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600 hover:text-indigo-700'
                      }`}
                    >
                      <span>{suggestion}</span>
                      <ArrowRight size={14} className={`opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                    </button>
                  ))}
               </div>
            </div>
        )}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${inputAreaColor} z-20 pb-safe transition-transform duration-300 ${isVoiceMode ? 'translate-y-full' : 'translate-y-0'}`}>
         <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2 max-w-2xl mx-auto"
        >
          <input 
            ref={inputRef}
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isOffline ? "Ask about tuning (Offline)..." : "Ask about tuning..."}
            className={`flex-1 border rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all shadow-inner ${inputBg}`}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isLoading}
            className={`p-3 rounded-xl text-white transition-colors shadow-lg ${!inputText.trim() || isLoading ? 'bg-slate-500 opacity-50' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30'}`}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AITuningAssistant;