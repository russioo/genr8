'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Image, Video } from 'lucide-react';
import { imageModels, videoModels } from '@/lib/models';

type DemoMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | null;
  metadata?: {
    type: 'payment' | 'generating' | 'generation';
    status?: 'processing' | 'confirmed';
    amount?: number;
    modelName?: string;
    imageUrl?: string;
  };
  createdAt: string;
};

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80',
  'https://images.unsplash.com/photo-1534361960057-19889dbdf1bb?w=800&q=80',
  'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&q=80',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
];

export default function DemoDashboard() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);

  const [prompt, setPrompt] = useState('');
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image');
  const [selectedModel, setSelectedModel] = useState('');
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentModels = generationType === 'image' ? imageModels : videoModels;
  const activeModel = currentModels.find((m) => m.id === selectedModel) || null;

  // Save to sessionStorage when messages change (clears on refresh)
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('demo-messages', JSON.stringify(messages));
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    } else {
      sessionStorage.removeItem('demo-messages');
    }
  }, [messages]);

  useEffect(() => {
    if (!modelMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [modelMenuOpen]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleSubmit = () => {
    if (!prompt.trim() || !selectedModel) return;
    
    const userPrompt = prompt.trim();
    const modelPrice = activeModel?.price || 0.04;
    
    // Add user message
    const userMessage: DemoMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userPrompt,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsGenerating(true);
    setElapsedSeconds(0);
    
    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    
    // Step 1: Processing payment (after 500ms)
    setTimeout(() => {
      const paymentProcessing: DemoMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: null,
        metadata: {
          type: 'payment',
          status: 'processing',
          amount: modelPrice,
        },
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, paymentProcessing]);
    }, 500);
    
    // Step 2: Payment confirmed (after 1500ms)
    setTimeout(() => {
      const paymentConfirmed: DemoMessage = {
        id: (Date.now() + 2).toString(),
        role: 'system',
        content: null,
        metadata: {
          type: 'payment',
          status: 'confirmed',
        },
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, paymentConfirmed]);
    }, 1500);
    
    // Step 3: Generating (after 2000ms)
    setTimeout(() => {
      const generating: DemoMessage = {
        id: (Date.now() + 3).toString(),
        role: 'system',
        content: null,
        metadata: {
          type: 'generating',
          modelName: activeModel?.name || 'Demo Model',
        },
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, generating]);
    }, 2000);
    
    // Step 4: Result (after 5-7 seconds)
    const resultDelay = 5000 + Math.random() * 2000;
    setTimeout(() => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsGenerating(false);
      
      const result: DemoMessage = {
        id: (Date.now() + 4).toString(),
        role: 'assistant',
        content: null,
        metadata: {
          type: 'generation',
          modelName: activeModel?.name || 'Demo Model',
          imageUrl: DEMO_IMAGES[Math.floor(Math.random() * DEMO_IMAGES.length)],
        },
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, result]);
    }, resultDelay);
  };

  return (
    <div className="h-[calc(100vh-96px)] flex flex-col relative">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto relative z-0">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center pt-8">
              <h1 className="text-4xl font-bold text-[var(--fg)] mb-3">What will you create?</h1>
              <p className="text-[var(--muted)]">Choose a model and describe your vision</p>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {messages.map((message, index) => {
                // User message
                if (message.role === 'user') {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="bg-[var(--accent)] text-[#0a0a0a] px-5 py-3 rounded-2xl font-medium max-w-md">
                        {message.content}
                      </div>
                    </div>
                  );
                }
                
                const metadata = message.metadata || {};
                
                // Payment processing
                if (metadata.type === 'payment' && metadata.status === 'processing') {
                  // Hide if confirmed exists after this message
                  const hasConfirmed = messages.slice(index + 1).some(m => 
                    m.metadata?.type === 'payment' && m.metadata?.status === 'confirmed'
                  );
                  if (hasConfirmed) return null;
                  return (
                    <div key={message.id} className="flex justify-start">
                      <div className="bg-[#111] border border-[#222] rounded-2xl px-5 py-3 flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-[#333] border-t-[var(--accent)] rounded-full animate-spin" />
                        <span className="text-sm text-white">Processing payment</span>
                        <span className="text-xs text-[var(--accent)] font-medium">${metadata.amount?.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                }
                
                // Payment confirmed
                if (metadata.type === 'payment' && metadata.status === 'confirmed') {
                  return (
                    <div key={message.id} className="flex justify-start">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-3 flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                        <span className="text-sm text-green-400">Payment confirmed</span>
                      </div>
                    </div>
                  );
                }
                
                // Generating
                if (metadata.type === 'generating') {
                  // Hide if result exists after this message
                  const hasResult = messages.slice(index + 1).some(m => 
                    m.metadata?.type === 'generation' || m.metadata?.type === 'error'
                  );
                  if (hasResult) return null;
                  return (
                    <div key={message.id} className="flex justify-start">
                      <div className="bg-[#111] border border-[#222] rounded-2xl px-5 py-4 w-72">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {isGenerating ? (
                              <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                            )}
                            <span className="text-sm text-white">{metadata.modelName}</span>
                          </div>
                          {isGenerating ? (
                            <span className="text-sm text-[#aaa] tabular-nums">{elapsedSeconds}s</span>
                          ) : (
                            <span className="text-xs text-green-500">Done</span>
                          )}
                        </div>
                        <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                          {isGenerating ? (
                            <div className="h-full w-full bg-[#222] relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent animate-slide" />
                            </div>
                          ) : (
                            <div className="h-full w-full bg-[var(--accent)] rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                // Generated image
                if (metadata.type === 'generation') {
                  return (
                    <div key={message.id} className="flex justify-start">
                      <div className="max-w-sm">
                        <div className="rounded-2xl overflow-hidden bg-[#111] border border-[#222] group">
                          <div className="relative">
                            <img src={metadata.imageUrl} alt="Demo generation" className="w-full" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="text-xs text-white font-medium">Demo Image</span>
                            </div>
                          </div>
                          <div className="px-4 py-3 flex items-center justify-between">
                            <span className="text-xs text-[#aaa]">{metadata.modelName}</span>
                            <span className="text-[8px] text-[#666] uppercase">Demo</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return null;
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#0d0d0d] border-[0.5px] border-[#1a1a1a] rounded-3xl p-4 shadow-2xl shadow-black/50 relative">
            {/* Demo Banner - small rounded box */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-[#111] border border-[var(--dim)] rounded-full px-4 py-1.5 flex items-center gap-2" style={{ border: '0.5px solid var(--dim)' }}>
                <span className="text-[10px] text-[var(--accent)] font-semibold uppercase tracking-wider">Demo Mode</span>
                <span className="text-[8px] text-[#666]">•</span>
                <span className="text-[10px] text-[#aaa]">Nothing will be generated real</span>
              </div>
            </div>
            
            {/* Input */}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder="Describe your vision..."
              className="w-full bg-transparent text-lg focus:outline-none placeholder:text-[#888] mb-4 px-2 pt-2"
            />
            
            {/* Controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Type pills */}
                <div className="flex rounded-full overflow-hidden bg-[#0a0a0a] p-1">
                  <button 
                    onClick={() => { setGenerationType('image'); setSelectedModel(''); }} 
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${generationType === 'image' ? 'bg-[var(--accent)] text-[#0a0a0a]' : 'text-[#aaa] hover:text-white'}`}
                  >
                    Image
                  </button>
                  <button 
                    onClick={() => { setGenerationType('video'); setSelectedModel(''); }} 
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${generationType === 'video' ? 'bg-[var(--accent)] text-[#0a0a0a]' : 'text-[#aaa] hover:text-white'}`}
                  >
                    Video
                  </button>
                </div>

                {/* Model selector */}
                <div className="relative" ref={modelMenuRef}>
                  <button 
                    onClick={() => setModelMenuOpen(!modelMenuOpen)} 
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${selectedModel ? 'bg-[#1a1a1a] text-white' : 'bg-[#0a0a0a] text-[#aaa] hover:text-white'}`}
                  >
                    {activeModel ? activeModel.name : 'Select model'}
                    <span className="text-[#888]">↓</span>
                  </button>
                  {modelMenuOpen && (
                    <div className="absolute bottom-full mb-2 left-0 bg-[#111] border border-[#222] rounded-2xl z-50 min-w-[220px] overflow-hidden shadow-2xl shadow-black/50">
                      {currentModels.map((model) => (
                        <button 
                          key={model.id} 
                          onClick={() => { setSelectedModel(model.id); setModelMenuOpen(false); }} 
                          className={`w-full px-4 py-3 text-left flex items-center justify-between text-sm transition-all ${selectedModel === model.id ? 'bg-[var(--accent)] text-[#0a0a0a]' : 'hover:bg-[#1a1a1a] text-white'}`}
                        >
                          <span>{model.name}</span>
                          <span className={`font-mono text-xs ${selectedModel === model.id ? 'text-[#0a0a0a]/70' : 'text-[var(--accent)]'}`}>${model.price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Generate */}
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || !selectedModel}
                className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${!prompt.trim() || !selectedModel ? 'bg-[#1a1a1a] text-[#888] cursor-not-allowed' : 'bg-[var(--accent)] text-[#0a0a0a] hover:shadow-lg hover:shadow-[var(--accent)]/30 hover:scale-105'}`}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

