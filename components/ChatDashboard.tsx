'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Plus, ArrowUpRight, Trash2, Zap, Image, Video, Send, Sparkles } from 'lucide-react';

import { imageModels, videoModels } from '@/lib/models';
import ResultDisplay from '@/components/ResultDisplay';
import GenerationProgress from '@/components/GenerationProgress';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
import { sendUSDCPayment, getUSDCBalance } from '@/lib/solana-payment';


type Chat = {
  id: string;
  owner_wallet: string;
  title: string | null;
  created_at: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
};

type PaymentRequestMetadata = {
  type: 'paymentRequest';
  amountUSD: number;
  modelId: string;
  modelName: string;
  generationId: string;
  prompt: string;
  generationType: 'image' | 'video';
  options?: any;
  chatId: string;
};

const POLLING_MODELS = new Set(['sora-2', 'veo-3.1', 'gpt-image-1', 'ideogram', 'qwen', 'grok-imagine', 'nano-banan-pro']);

export default function ChatDashboard() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const walletAddress = publicKey?.toBase58();

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [deletingChatIds, setDeletingChatIds] = useState<Set<string>>(new Set());
  const [newChatId, setNewChatId] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image');
  const [selectedModel, setSelectedModel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [payingGenerationId, setPayingGenerationId] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<any>(null);

  const [aspectRatio, setAspectRatio] = useState<'landscape' | 'portrait'>('landscape');
  const [nFrames, setNFrames] = useState<'10' | '15'>('10');
  const [veoAspectRatio, setVeoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [image4oSize, setImage4oSize] = useState<'1:1' | '3:2' | '2:3'>('1:1');
  const [image4oVariants, setImage4oVariants] = useState<1 | 2 | 4>(1);
  const [ideogramImageSize, setIdeogramImageSize] = useState<'square' | 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9'>('square_hd');
  const [ideogramRenderingSpeed, setIdeogramRenderingSpeed] = useState<'TURBO' | 'BALANCED' | 'QUALITY'>('BALANCED');
  const [ideogramStyle, setIdeogramStyle] = useState<'AUTO' | 'GENERAL' | 'REALISTIC' | 'DESIGN'>('AUTO');
  const [qwenImageSize, setQwenImageSize] = useState<'square' | 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9'>('square_hd');
  const [qwenNumInferenceSteps, setQwenNumInferenceSteps] = useState(30);
  const [qwenGuidanceScale, setQwenGuidanceScale] = useState(2.5);
  const [qwenAcceleration, setQwenAcceleration] = useState<'none' | 'regular' | 'high'>('none');
  
  // Grok Imagine settings
  const [grokImagineMode, setGrokImagineMode] = useState<'fun' | 'normal' | 'spicy'>('normal');
  const [grokImagineImageUrls, setGrokImagineImageUrls] = useState<string[]>([]);
  const [grokImagineTaskId, setGrokImagineTaskId] = useState<string>('');
  const [grokImagineIndex, setGrokImagineIndex] = useState<number>(0);
  
  // Nano Banana Pro settings
  const [nanoBananaAspectRatio, setNanoBananaAspectRatio] = useState<'1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9' | 'auto'>('1:1');
  const [nanoBananaResolution, setNanoBananaResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [nanoBananaOutputFormat, setNanoBananaOutputFormat] = useState<'png' | 'jpg'>('png');
  const [nanoBananaImageInput, setNanoBananaImageInput] = useState<string[]>([]);
  const [paymentMethodByGenId, setPaymentMethodByGenId] = useState<Map<string, 'gen'>>(new Map());
  const [defaultPaymentMethod] = useState<'gen'>('gen');
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStyle, setOptimizationStyle] = useState<'normal' | 'realistic' | 'ghibli' | 'drawn' | 'anime' | 'cinematic' | '3d'>('normal');
  const [showOptimizerMenu, setShowOptimizerMenu] = useState(false);

  const paymentStatusByGenerationId = useMemo(() => {
    const statusMap = new Map<string, string>();
    messages.forEach((message) => {
      const metadata = message.metadata as Record<string, any> | null;
      if (metadata?.type === 'paymentStatus' && typeof metadata.generationId === 'string' && typeof metadata.status === 'string') {
        statusMap.set(metadata.generationId, metadata.status);
      }
    });
    return statusMap;
  }, [messages]);

  const currentModels = useMemo(() => generationType === 'image' ? imageModels : videoModels, [generationType]);
  const activeModel = useMemo(() => currentModels.find((m) => m.id === selectedModel) || null, [currentModels, selectedModel]);

  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const optimizerMenuRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pendingDeletes = useRef<Set<string>>(new Set());

  const fetchChats = useCallback(async () => {
    if (!walletAddress) return;
    setLoadingChats(true);
    try {
      const res = await fetch(`/api/chats?wallet=${walletAddress}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setChats(data.chats || []);
      if (!activeChatId && data.chats?.length) setActiveChatId(data.chats[0].id);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoadingChats(false);
    }
  }, [walletAddress, activeChatId]);

  const fetchMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!walletAddress) { setChats([]); setActiveChatId(null); setMessages([]); return; }
    fetchChats();
  }, [walletAddress, fetchChats]);

  useEffect(() => {
    if (activeChatId) fetchMessages(activeChatId);
    else setMessages([]);
  }, [activeChatId, fetchMessages]);

  // Check token balance for optimizer access
  useEffect(() => {
    async function checkBalance() {
      if (connected && publicKey) {
        try {
          const balance = await getUSDCBalance(connection, publicKey);
          setTokenBalance(balance);
        } catch (error) {
          console.error('Error checking balance:', error);
          setTokenBalance(0);
        }
      } else {
        setTokenBalance(null);
      }
    }
    checkBalance();
  }, [connected, publicKey, connection]);

  const hasOptimizerAccess = tokenBalance !== null && tokenBalance >= 100000;

  const handleOptimizePrompt = async () => {
    if (!prompt.trim() || !hasOptimizerAccess || isOptimizing) return;
    
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/optimize-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          type: generationType,
          style: optimizationStyle,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to optimize prompt');
      
      const data = await response.json();
      setPrompt(data.optimizedPrompt);
      setShowOptimizerMenu(false);
    } catch (error) {
      console.error('Error optimizing prompt:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (!modelMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) setModelMenuOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [modelMenuOpen]);

  // Close optimizer menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optimizerMenuRef.current && !optimizerMenuRef.current.contains(e.target as Node)) {
        setShowOptimizerMenu(false);
      }
    };

    if (showOptimizerMenu) {
      window.addEventListener('mousedown', handleClickOutside);
    }

    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showOptimizerMenu]);

  const createChat = useCallback(async () => {
    if (!walletAddress) return null;
    try {
      const res = await fetch('/api/chats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet: walletAddress }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const newChat: Chat = data.chat;
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      return newChat.id;
    } catch (error) {
      console.error('Failed to create chat:', error);
      return null;
    }
  }, [walletAddress]);

  const appendMessage = useCallback(async (chatId: string, message: { role: 'user' | 'assistant' | 'system'; content?: string | null; metadata?: Record<string, any> | null; }) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const saved: ChatMessage = data.message;
      setMessages((prev) => [...prev, saved]);
      return saved;
    } catch (error) {
      console.error('Failed to append message:', error);
      return null;
    }
  }, []);

  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    if (!title.trim()) return;
    try {
      const res = await fetch('/api/chats', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: chatId, title }) });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setChats((prev) => prev.map((chat) => chat.id === chatId ? data.chat : chat));
    } catch (error) {
      console.error('Failed to update chat title:', error);
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    if (!chatId || !walletAddress) return;
    try {
      const res = await fetch(`/api/chats?${new URLSearchParams({ id: chatId, wallet: walletAddress })}`, { method: 'DELETE', cache: 'no-store' });
      if (!res.ok) throw new Error(await res.text());
      const responseData = await res.json();
      if (!responseData?.success) throw new Error(responseData?.error || 'Delete failed');
      let nextActiveId: string | null = null;
      setChats((prev) => {
        const updated = prev.filter((c) => c.id !== chatId);
        if (chatId === activeChatId) nextActiveId = updated.length ? updated[0].id : null;
        return updated;
      });
      if (chatId === activeChatId) { setActiveChatId(nextActiveId); if (!nextActiveId) setMessages([]); }
      await fetchChats();
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  }, [activeChatId, fetchChats, walletAddress]);

  const ensureActiveChat = useCallback(async () => {
    if (activeChatId) return activeChatId;
    return await createChat();
  }, [activeChatId, createChat]);

  const addStatusMessage = useCallback((chatId: string, status: 'pending' | 'processing' | 'completed' | 'error', details?: Record<string, any>) =>
    appendMessage(chatId, { role: 'system', content: status === 'error' ? details?.errorMessage || 'Generation failed' : null, metadata: { type: 'status', status, ...(details || {}) } }), [appendMessage]);

  const handleGenerationSuccess = useCallback(async (data: any, context: { prompt: string; model: any; chatId: string; options?: any }) => {
    const { prompt, model, chatId } = context;
    const resultPayload = { type: generationType, url: data.result, urls: data.resultUrls, prompt, modelName: model.name } as const;
    await appendMessage(chatId, { role: 'assistant', content: null, metadata: { type: 'generation', modelId: model.id, modelName: model.name, generationType, prompt, result: data.result, resultUrls: data.resultUrls, transactionSignature: data.signature || null } });
    return resultPayload;
  }, [appendMessage, generationType]);

  const startPolling = useCallback(async ({ taskId, model, prompt, chatId, options, userWallet, paymentMethod, amountPaidUSD }: any) => {
    return new Promise<void>((resolve) => {
      // Don't reset timer - use existing one from handleGenerate
      const cleanup = (action?: () => void) => { window.clearInterval(pollInterval); window.clearTimeout(timeoutId); action?.(); resolve(); };
      const poll = async () => {
        try {
          const r = await axios.get(`/api/generate/${taskId}?model=${model.id}`, { headers: { 'X-User-Wallet': userWallet || walletAddress || '', 'X-Payment-Method': paymentMethod || 'gen', 'X-Amount-Paid': amountPaidUSD?.toString() || '' } });
          if (r.data.success && r.data.state === 'completed') {
            cleanup(async () => {
              const outcome = await handleGenerationSuccess(r.data, { prompt, model, chatId, options });
              if (outcome) setLatestResult(outcome);
              setIsGenerating(false);
            });
          } else if (r.data.state === 'failed') {
            cleanup(async () => {
              const err = r.data.errorMessage || r.data.message || 'Generation failed';
              await addStatusMessage(chatId, 'error', { errorMessage: err, modelId: model.id, modelName: model.name, prompt });
              setIsGenerating(false);
            });
          }
        } catch (error: any) {
          const ed = error?.response?.data || {};
          if (ed.state === 'failed' || (typeof ed.errorMessage === 'string' && ed.errorMessage.toLowerCase().includes('flagged'))) {
            cleanup(async () => {
              const err = ed.errorMessage || 'Generation failed.';
              await addStatusMessage(chatId, 'error', { errorMessage: err, modelId: model.id, modelName: model.name, prompt });
              setIsGenerating(false);
            });
          }
        }
      };
      const pollInterval = window.setInterval(poll, 5000);
      const timeoutId = window.setTimeout(() => cleanup(async () => { await addStatusMessage(chatId, 'error', { errorMessage: 'Timed out after 5 minutes.' }); setIsGenerating(false); }), 5 * 60 * 1000);
      poll();
    });
  }, [addStatusMessage, handleGenerationSuccess, walletAddress]);

  const handleShare = useCallback(async (url: string, urls?: string[]) => {
    const shareUrl = urls?.length ? urls[0] : url;
    try { await navigator.clipboard.writeText(shareUrl); alert('URL copied!'); } catch { alert('URL: ' + shareUrl); }
  }, []);

  // Clear any existing timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedSeconds(0);
  }, []);
  
  // Start timer
  const startTimer = useCallback(() => {
    clearTimer();
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, [clearTimer]);

  // Generation flow with actual payment - all saved as messages
  const handleGenerate = useCallback(async (chatId: string, promptText: string, options?: any, paymentSignature?: string, paymentMethod: 'usdc' | 'gen' = 'usdc') => {
    if (!selectedModel) return;
    const model = currentModels.find((m) => m.id === selectedModel);
    if (!model) return;
    
    // Check if model is coming soon
    if (model.comingSoon) {
      await appendMessage(chatId, {
        role: 'system',
        content: null,
        metadata: { type: 'error', message: `${model.name} is coming soon. Please check back later.` }
      });
      return;
    }
    
    // Reset
    clearTimer();
    setIsGenerating(true);
    
    // Step 1: Generating message + start timer
    startTimer();
    
    await appendMessage(chatId, {
      role: 'system',
      content: null,
      metadata: { type: 'generating', modelName: model.name, prompt: promptText }
    });
    
    try {
      const amountPaidUSD = paymentMethod === 'usdc' ? model.price : model.price;
      const response = await axios.post('/api/generate', {
        model: selectedModel,
        prompt: promptText,
        type: generationType,
        options,
        paymentSignature,
        userWallet: walletAddress,
        paymentMethod,
        amountPaidUSD,
      });
      
      // Handle coming soon response
      if (response?.data?.comingSoon) {
        clearTimer();
        setIsGenerating(false);
        await appendMessage(chatId, {
          role: 'system',
          content: null,
          metadata: { type: 'error', message: response.data.message || `${model.name} is coming soon. Please check back later.` }
        });
        return;
      }
      
      if (response?.data?.success) {
        const needsPolling = POLLING_MODELS.has(model.id) && response.data.taskId;
        if (needsPolling) {
          await startPolling({
            taskId: response.data.taskId,
            model,
            prompt: promptText,
            chatId,
            options,
            userWallet: walletAddress || '',
            paymentMethod,
            amountPaidUSD
          });
          // Polling finished
          clearTimer();
          setIsGenerating(false);
        } else {
          clearTimer();
          const resultData = await handleGenerationSuccess(response.data, { prompt: promptText, model, chatId, options });
          if (resultData) setLatestResult(resultData);
          setIsGenerating(false);
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      clearTimer();
      setIsGenerating(false);
      
      // Handle coming soon error
      if (error?.response?.status === 503 && error?.response?.data?.comingSoon) {
        await appendMessage(chatId, {
          role: 'system',
          content: null,
          metadata: { type: 'error', message: error.response.data.message || `${model.name} is coming soon. Please check back later.` }
        });
      } else {
        await appendMessage(chatId, {
          role: 'system',
          content: null,
          metadata: { type: 'error', message: error?.response?.data?.failMsg || error?.response?.data?.message || error?.message || 'Generation failed' }
        });
      }
    }
  }, [selectedModel, generationType, currentModels, walletAddress, startPolling, handleGenerationSuccess, appendMessage, clearTimer, startTimer]);

  const completeGenerationAfterPayment = useCallback(async (metadata: any, signature: string) => {
    const model = [...imageModels, ...videoModels].find((m) => m.id === metadata.modelId);
    if (!model) return;
    const paymentMethod = 'gen';
    await handleGenerate(metadata.chatId, metadata.prompt, metadata.options || {}, signature, paymentMethod);
  }, [handleGenerate, paymentMethodByGenId]);

  const handlePaymentAction = useCallback(async (metadata: PaymentRequestMetadata) => {
    if (!connected || !publicKey || !connection || !signTransaction) { alert('Connect wallet first'); return; }
    
    const baseAmount = metadata.amountUSD;
    setPayingGenerationId(metadata.generationId);
    await appendMessage(metadata.chatId, { role: 'system', content: null, metadata: { type: 'paymentStatus', status: 'processing', generationId: metadata.generationId, amountUSD: baseAmount, paymentMethod: 'gen' } });
    try {
      // Pay with $GENR8 token - price calculated via DexScreener
      const { sendUSDCPayment } = await import('@/lib/solana-payment');
      const result = await sendUSDCPayment(connection, publicKey, signTransaction, baseAmount);
      
      if (!result.success || !result.signature) { 
        await appendMessage(metadata.chatId, { role: 'system', content: null, metadata: { type: 'paymentStatus', status: 'error', generationId: metadata.generationId, errorMessage: result.error || 'Payment failed' } }); 
        return; 
      }
      await appendMessage(metadata.chatId, { role: 'system', content: null, metadata: { type: 'paymentStatus', status: 'completed', generationId: metadata.generationId, transactionSignature: result.signature } });
      await completeGenerationAfterPayment({ ...metadata }, result.signature);
    } catch (error: any) {
      await appendMessage(metadata.chatId, { role: 'system', content: null, metadata: { type: 'paymentStatus', status: 'error', generationId: metadata.generationId, errorMessage: error?.message || 'Payment error' } });
    } finally {
      setPayingGenerationId(null);
    }
  }, [appendMessage, completeGenerationAfterPayment, connection, connected, publicKey, signTransaction]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || !selectedModel) return;
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }
    
    const chatId = await ensureActiveChat();
    if (!chatId) return;
    
    const model = currentModels.find((m) => m.id === selectedModel);
    if (!model) return;
    
    const userMessage = await appendMessage(chatId, { role: 'user', content: prompt.trim(), metadata: { type: 'prompt', generationType, modelId: selectedModel } });
    if (userMessage && !chats.find((c) => c.id === chatId)?.title) updateChatTitle(chatId, prompt.trim().slice(0, 64));
    setPrompt('');
    
    const options: any = {};
    if (selectedModel === 'sora-2') { options.aspect_ratio = aspectRatio; options.n_frames = nFrames; options.remove_watermark = true; }
    else if (selectedModel === 'veo-3.1') { options.aspectRatio = veoAspectRatio; }
    else if (selectedModel === 'gpt-image-1') { options.size = image4oSize; options.nVariants = image4oVariants; }
    else if (selectedModel === 'ideogram') { options.image_size = ideogramImageSize; options.rendering_speed = ideogramRenderingSpeed; options.style = ideogramStyle; }
    else if (selectedModel === 'qwen') { options.image_size = qwenImageSize; options.num_inference_steps = qwenNumInferenceSteps; options.guidance_scale = qwenGuidanceScale; options.acceleration = qwenAcceleration; }
    else if (selectedModel === 'grok-imagine') { 
      options.mode = grokImagineMode;
      if (grokImagineImageUrls.length > 0) {
        options.image_urls = grokImagineImageUrls;
      } else if (grokImagineTaskId) {
        options.task_id = grokImagineTaskId;
        options.index = grokImagineIndex;
      }
    }
    else if (selectedModel === 'nano-banan-pro') { 
      options.aspect_ratio = nanoBananaAspectRatio;
      options.resolution = nanoBananaResolution;
      options.output_format = nanoBananaOutputFormat;
      if (nanoBananaImageInput.length > 0) {
        options.image_input = nanoBananaImageInput;
      }
    }
    
    // Create payment request
    const generationId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const paymentMethod = defaultPaymentMethod;
    setPaymentMethodByGenId(prev => new Map(prev).set(generationId, paymentMethod));
    
    await appendMessage(chatId, {
      role: 'system',
      content: null,
      metadata: {
        type: 'paymentRequest',
        amountUSD: model.price,
        modelId: selectedModel,
        modelName: model.name,
        generationId,
        prompt: userMessage?.content || prompt.trim(),
        generationType,
        options,
        chatId,
      }
    });
  }, [prompt, ensureActiveChat, appendMessage, generationType, selectedModel, chats, updateChatTitle, aspectRatio, nFrames, veoAspectRatio, image4oSize, image4oVariants, ideogramImageSize, ideogramRenderingSpeed, ideogramStyle, qwenImageSize, qwenNumInferenceSteps, qwenGuidanceScale, qwenAcceleration, grokImagineMode, grokImagineImageUrls, grokImagineTaskId, grokImagineIndex, nanoBananaAspectRatio, nanoBananaResolution, nanoBananaOutputFormat, nanoBananaImageInput, connected, publicKey, currentModels, defaultPaymentMethod]);

  const renderMessageContent = (message: ChatMessage) => {
    // User prompt
    if (message.role === 'user') return (
      <div className="bg-[var(--accent)] text-[#0a0a0a] px-5 py-3 rounded-2xl font-medium max-w-md">
        {message.content}
      </div>
    );
    
    const metadata = message.metadata || {};
    
    // Payment request
    if (metadata.type === 'paymentRequest') {
      const paymentRequestMetadata = metadata as PaymentRequestMetadata;
      const paymentStatus = paymentStatusByGenerationId.get(paymentRequestMetadata.generationId);
      const isPaying = payingGenerationId === paymentRequestMetadata.generationId;
      
      // Hide if payment is completed or error
      if (paymentStatus === 'completed' || paymentStatus === 'error') {
        return null;
      }
      
      return (
        <div className="bg-[#111] border border-[#222] rounded-2xl p-5 max-w-md">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white mb-1">Pay ${paymentRequestMetadata.amountUSD.toFixed(2)}</h3>
            <p className="text-xs text-[#aaa]">{paymentRequestMetadata.modelName}</p>
          </div>
          
          {/* Payment method - GENR8 only */}
          <div className="mb-4">
            <div className="w-full px-4 py-3 rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    $GENR8
                  </div>
                  <div className="text-xs text-[#aaa]">Pay with $GENR8 token</div>
                </div>
                <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <span className="text-[#0a0a0a] text-xs">✓</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pay button */}
          <button
            onClick={() => handlePaymentAction(paymentRequestMetadata)}
            disabled={isPaying || !connected}
            className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
              isPaying || !connected
                ? 'bg-[#1a1a1a] text-[#666] cursor-not-allowed'
                : 'bg-[var(--accent)] text-[#0a0a0a] hover:shadow-lg hover:shadow-[var(--accent)]/30'
            }`}
          >
            {isPaying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#666] border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : paymentStatus === 'processing' ? (
              'Processing payment...'
            ) : (
              `Pay $${paymentRequestMetadata.amountUSD.toFixed(2)}`
            )}
          </button>
        </div>
      );
    }
    
    // Payment status
    if (metadata.type === 'paymentStatus') {
      if (metadata.status === 'processing') {
        return (
          <div className="bg-[#111] border border-[#222] rounded-2xl px-5 py-3 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-[#333] border-t-[var(--accent)] rounded-full animate-spin" />
            <span className="text-sm text-white">Processing payment</span>
            <span className="text-xs text-[var(--accent)] font-medium">${metadata.amountUSD?.toFixed(2)}</span>
          </div>
        );
      }
      
      if (metadata.status === 'completed') {
        return (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-3 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
            <span className="text-sm text-green-400">Payment confirmed</span>
          </div>
        );
      }
      
      if (metadata.status === 'error') {
        return (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm max-w-sm">
            Payment failed: {metadata.errorMessage || 'Unknown error'}
          </div>
        );
      }
    }
    
    // Payment processing (legacy)
    if (metadata.type === 'payment' && metadata.status === 'processing') {
      // Hide if confirmed exists after
      const hasConfirmed = messages.some(m => m.metadata?.type === 'payment' && m.metadata?.status === 'confirmed' && m.created_at > message.created_at);
      if (hasConfirmed) return null;
      return (
        <div className="bg-[#111] border border-[#222] rounded-2xl px-5 py-3 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[#333] border-t-[var(--accent)] rounded-full animate-spin" />
          <span className="text-sm text-white">Processing payment</span>
          <span className="text-xs text-[var(--accent)] font-medium">${metadata.amount?.toFixed(2)}</span>
        </div>
      );
    }
    
    // Payment confirmed
    if (metadata.type === 'payment' && metadata.status === 'confirmed') {
      return (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-3 flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
          <span className="text-sm text-green-400">Payment confirmed</span>
      </div>
    );
    }
    
    // Generating with progress
    if (metadata.type === 'generating') {
      // Hide if result or error exists after
      const hasResult = messages.some(m => (m.metadata?.type === 'generation' || m.metadata?.type === 'error') && m.created_at > message.created_at);
      if (hasResult) return null;
      
      return (
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
      );
    }
    
    // Generated image or video
    if (metadata.type === 'generation') {
      const resultUrl = metadata.resultUrls?.[0] || metadata.result;
      const isVideo = metadata.generationType === 'video';
      
      return (
        <div className="max-w-sm">
          <div className="rounded-2xl overflow-hidden bg-[#111] border border-[#222]">
            {isVideo ? (
              <CustomVideoPlayer src={resultUrl} />
            ) : (
              <img src={resultUrl} alt="" className="w-full" />
            )}
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-[#aaa]">{metadata.modelName}</span>
              <button onClick={() => handleShare(resultUrl)} className="text-xs text-[#aaa] hover:text-white">
                Share ↗
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Error
    if (metadata.type === 'error') {
      return (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm max-w-sm">
          {metadata.message}
        </div>
      );
    }
    
    return null;
  };


  // Create new chat
  const handleNewChat = useCallback(async () => {
    const chatId = await createChat();
    if (chatId) {
      setNewChatId(chatId);
      setMessages([]);
      // Remove new animation after it's done
      setTimeout(() => {
        setNewChatId(null);
      }, 300);
    }
  }, [createChat]);

  // Delete chat
  const handleDeleteChat = useCallback(async (chatId: string) => {
    if (!publicKey) return;
    if (pendingDeletes.current.has(chatId)) return; // Already deleting
    if (deletingChatIds.has(chatId)) return; // Already animating out
    
    pendingDeletes.current.add(chatId);
    
    // Start deletion animation
    setDeletingChatIds(prev => new Set(prev).add(chatId));
    
    // Switch to another chat if deleting active one
    if (activeChatId === chatId) {
      const remaining = chats.filter(c => c.id !== chatId);
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        setActiveChatId(null);
        setMessages([]);
      }
    }
    
    // Wait for animation to complete (250ms)
    setTimeout(() => {
      setChats(prev => prev.filter(c => c.id !== chatId));
      setDeletingChatIds(prev => {
        const next = new Set(prev);
        next.delete(chatId);
        return next;
      });
    }, 250);
    
    // Delete from backend
    try {
      await fetch(`/api/chats?id=${chatId}&wallet=${publicKey.toBase58()}`, { method: 'DELETE' });
    } finally {
      pendingDeletes.current.delete(chatId);
    }
  }, [activeChatId, chats, publicKey, deletingChatIds]);

  // Not connected - show sleek login message
  if (!connected) {
    return (
      <div className="h-[calc(100vh-96px)] flex items-center justify-center px-6">
        <div className="text-center animate-fade-in max-w-md">
          <h2 className="text-3xl font-semibold text-[var(--fg)] mb-3 tracking-tight">
            Login to start creating
          </h2>
          <p className="text-[var(--muted)] text-sm leading-relaxed">
            Connect your wallet to begin generating images and videos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-96px)] flex flex-col relative">
      {/* Messages area */}
      <div 
        className="flex-1 overflow-y-auto relative z-0 scrollbar-sleek" 
        style={{ 
          WebkitOverflowScrolling: 'touch', 
          scrollBehavior: 'smooth',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
        data-lenis-prevent
      >
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Sessions - Sticky header */}
          <div className="sticky top-0 z-10 pb-4 pt-4 -mt-8 -mx-6 px-6 bg-[#0a0a0a] rounded-2xl mb-6" style={{ border: '0.5px solid var(--dim)', pointerEvents: 'auto' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider text-[#666]">Sessions</p>
              <button 
                onClick={handleNewChat}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111] border border-[#222] text-[#aaa] hover:text-white hover:border-[var(--accent)] hover:bg-[#1a1a1a] transition-all group"
                title="Create new session"
              >
                <Plus className="w-4 h-4 group-hover:text-[var(--accent)] transition-colors" />
                <span className="text-xs font-medium">New Chat</span>
              </button>
            </div>
            <div 
              className="flex items-center gap-2 overflow-x-auto scrollbar-sleek pb-1" 
              style={{ 
                WebkitOverflowScrolling: 'touch', 
                scrollBehavior: 'smooth',
                touchAction: 'pan-x',
                overscrollBehavior: 'contain'
              }}
              data-lenis-prevent
            >
              {chats.length === 0 ? (
                <span className="text-[10px] text-[#666] italic">No sessions yet</span>
              ) : (
                chats.slice(0, 8).map((chat) => {
                  const isDeleting = deletingChatIds.has(chat.id);
                  const isNew = newChatId === chat.id;
                  return (
                    <div
                      key={chat.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-2xl text-xs whitespace-nowrap transition-all cursor-pointer ${
                        isDeleting 
                          ? 'opacity-0 scale-95 -translate-x-2 pointer-events-none' 
                          : isNew
                          ? 'animate-fade-in-scale'
                          : 'opacity-100 scale-100 translate-x-0'
                      } ${
                        activeChatId === chat.id 
                          ? 'bg-[var(--accent)] text-[#0a0a0a]' 
                          : 'bg-[#111] text-[#aaa] hover:text-white hover:bg-[#1a1a1a]'
                      }`}
                      onClick={() => setActiveChatId(chat.id)}
                      style={{
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <span className="max-w-[120px] truncate">
                        {chat.title || 'New session'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        className={`p-0.5 rounded transition-all ${
                          activeChatId === chat.id 
                            ? 'hover:bg-[#0a0a0a]/20 text-[#0a0a0a]/60 hover:text-[#0a0a0a]' 
                            : 'opacity-0 group-hover:opacity-100 hover:text-red-400'
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                  </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center pt-8">
              <h1 className="text-4xl font-bold text-[var(--fg)] mb-3">What will you create?</h1>
              <p className="text-[var(--muted)]">Choose a model and describe your vision</p>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {messages.map((message) => {
                const bubble = renderMessageContent(message);
                if (!bubble) return null;
                return (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {bubble}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area - sleek floating bar */}
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#0d0d0d] border-[0.5px] border-[#1a1a1a] rounded-3xl p-4 shadow-2xl shadow-black/50">
            {/* Input */}
            <div className="relative mb-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Describe your vision..."
                className="w-full bg-transparent text-lg focus:outline-none placeholder:text-[#888] px-2 pr-10"
                disabled={isGenerating}
              />
              {prompt.trim() && hasOptimizerAccess && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="relative" ref={optimizerMenuRef}>
                    <button
                      onClick={() => setShowOptimizerMenu(!showOptimizerMenu)}
                      className="p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors group"
                      title="Optimize prompt"
                    >
                      <Sparkles className={`w-4 h-4 ${showOptimizerMenu ? 'text-[var(--accent)]' : 'text-[#666] group-hover:text-[var(--accent)]'} transition-colors`} />
                    </button>
                    {showOptimizerMenu && (
                      <div className="absolute bottom-full mb-2 right-0 bg-[#111] border border-[#222] rounded-xl z-50 min-w-[200px] shadow-2xl shadow-black/50 overflow-hidden">
                        <div className="p-2 border-b border-[#222]">
                          <p className="text-xs text-[#666] uppercase tracking-wider px-2 py-1">Style</p>
                          <div className="flex flex-wrap gap-1 p-1">
                            {[
                              { id: 'normal', label: 'Normal' },
                              { id: 'realistic', label: 'Realistic' },
                              { id: 'ghibli', label: 'Ghibli' },
                              { id: 'drawn', label: 'Drawn' },
                              { id: 'anime', label: 'Anime' },
                              { id: 'cinematic', label: 'Cinematic' },
                              { id: '3d', label: '3D' },
                            ].map((style) => (
                              <button
                                key={style.id}
                                onClick={() => setOptimizationStyle(style.id as any)}
                                className={`px-2 py-1 text-xs rounded-md transition-all ${
                                  optimizationStyle === style.id
                                    ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                    : 'bg-[#0a0a0a] text-[#aaa] hover:text-white hover:bg-[#1a1a1a]'
                                }`}
                              >
                                {style.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={handleOptimizePrompt}
                          disabled={isOptimizing}
                          className="w-full px-4 py-2.5 text-sm font-medium bg-[var(--accent)] text-[#0a0a0a] hover:bg-[var(--accent)]/90 transition-all flex items-center justify-center gap-2"
                        >
                          {isOptimizing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                              Optimizing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Optimize
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Controls row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Type pills */}
              <div className="flex rounded-full overflow-hidden bg-[#0a0a0a] p-1">
                <button onClick={() => { setGenerationType('image'); setSelectedModel(''); }} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${generationType === 'image' ? 'bg-[var(--accent)] text-[#0a0a0a]' : 'text-[#aaa] hover:text-white'}`}>
                  Image
                </button>
                <button onClick={() => { setGenerationType('video'); setSelectedModel(''); }} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${generationType === 'video' ? 'bg-[var(--accent)] text-[#0a0a0a]' : 'text-[#aaa] hover:text-white'}`}>
                  Video
                </button>
              </div>

              {/* Model selector */}
              <div className="relative" ref={modelMenuRef}>
                <button onClick={() => setModelMenuOpen(!modelMenuOpen)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${selectedModel ? 'bg-[#1a1a1a] text-white' : 'bg-[#0a0a0a] text-[#aaa] hover:text-white'}`}>
                  {activeModel ? activeModel.name : 'Select model'}
                  <span className="text-[#888]">↓</span>
                </button>
                {modelMenuOpen && (
                  <div className="absolute bottom-full mb-2 left-0 bg-[#111] border border-[#222] rounded-2xl z-50 min-w-[220px] overflow-hidden shadow-2xl shadow-black/50">
                    {currentModels.map((model) => {
                      const isComingSoon = model.comingSoon;
                      return (
                        <button 
                          key={model.id} 
                          onClick={() => { if (!isComingSoon) { setSelectedModel(model.id); setModelMenuOpen(false); } }} 
                          disabled={isComingSoon}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between text-sm transition-all relative ${
                            isComingSoon 
                              ? 'opacity-60 cursor-not-allowed text-[#666]' 
                              : selectedModel === model.id 
                              ? 'bg-[var(--accent)] text-[#0a0a0a]' 
                              : 'hover:bg-[#1a1a1a] text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{model.name}</span>
                            {isComingSoon && (
                              <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full font-semibold">
                                Soon
                              </span>
                            )}
                          </div>
                          {!isComingSoon && (
                            <span className={`font-mono text-xs ${selectedModel === model.id ? 'text-[#0a0a0a]/70' : 'text-[var(--accent)]'}`}>${model.price.toFixed(2)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Create button - inline */}
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || !selectedModel || isGenerating}
                className={`ml-auto px-5 py-1.5 rounded-full font-semibold text-xs transition-all ${!prompt.trim() || !selectedModel || isGenerating ? 'bg-[#1a1a1a] text-[#666] cursor-not-allowed' : 'bg-[var(--accent)] text-[#0a0a0a] hover:shadow-lg hover:shadow-[var(--accent)]/30'}`}
              >
                {isGenerating ? 'Creating...' : 'Create'}
              </button>
            </div>

            {/* Settings for each model - appears BELOW the controls row */}
            {selectedModel && (
              <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                {/* Sora 2 Settings */}
                {selectedModel === 'sora-2' && (
                  <div className="flex items-end gap-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Aspect</label>
                      <div className="flex gap-1">
                        {['landscape', 'portrait'].map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio as 'landscape' | 'portrait')}
                            className={`px-3 py-1.5 rounded text-[10px] font-medium transition-all ${
                              aspectRatio === ratio
                                ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                : 'bg-[#0a0a0a] text-[#888] hover:text-white hover:bg-[#111] border border-[#1a1a1a]'
                            }`}
                          >
                            {ratio.charAt(0).toUpperCase() + ratio.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Frames</label>
                      <div className="flex gap-1">
                        {['10', '15'].map((frames) => (
                          <button
                            key={frames}
                            onClick={() => setNFrames(frames as '10' | '15')}
                            className={`px-3 py-1.5 rounded text-[10px] font-medium transition-all ${
                              nFrames === frames
                                ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                : 'bg-[#0a0a0a] text-[#888] hover:text-white hover:bg-[#111] border border-[#1a1a1a]'
                            }`}
                          >
                            {frames}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Veo 3.1 Settings */}
                {selectedModel === 'veo-3.1' && (
                  <div className="flex items-end gap-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Aspect</label>
                      <div className="flex gap-1">
                        {['16:9', '9:16'].map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setVeoAspectRatio(ratio as '16:9' | '9:16')}
                            className={`px-3 py-1.5 rounded text-[10px] font-medium transition-all ${
                              veoAspectRatio === ratio
                                ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                : 'bg-[#0a0a0a] text-[#888] hover:text-white hover:bg-[#111] border border-[#1a1a1a]'
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4o Image Settings */}
                {selectedModel === 'gpt-image-1' && (
                  <div className="flex items-end gap-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Size</label>
                      <div className="flex gap-1">
                        {['1:1', '3:2', '2:3'].map((size) => (
                          <button
                            key={size}
                            onClick={() => setImage4oSize(size as '1:1' | '3:2' | '2:3')}
                            className={`px-3 py-1.5 rounded text-[10px] font-medium transition-all ${
                              image4oSize === size
                                ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                : 'bg-[#0a0a0a] text-[#888] hover:text-white hover:bg-[#111] border border-[#1a1a1a]'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Variants</label>
                      <div className="flex gap-1">
                        {[1, 2, 4].map((num) => (
                          <button
                            key={num}
                            onClick={() => setImage4oVariants(num as 1 | 2 | 4)}
                            className={`px-3 py-1.5 rounded text-[10px] font-medium transition-all ${
                              image4oVariants === num
                                ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                : 'bg-[#0a0a0a] text-[#888] hover:text-white hover:bg-[#111] border border-[#1a1a1a]'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ideogram Settings */}
                {selectedModel === 'ideogram' && (
                  <div className="flex items-end gap-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Size</label>
                      <select
                        value={ideogramImageSize}
                        onChange={(e) => setIdeogramImageSize(e.target.value as any)}
                        className="px-3 py-1.5 rounded text-[10px] bg-[#0a0a0a] text-white border border-[#1a1a1a] focus:border-[var(--accent)] focus:outline-none"
                      >
                        {['square', 'square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'].map((size) => (
                          <option key={size} value={size}>{size.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Speed</label>
                      <div className="flex gap-1">
                        {['TURBO', 'BALANCED', 'QUALITY'].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => setIdeogramRenderingSpeed(speed as any)}
                            className={`px-2 py-1.5 rounded text-[9px] font-medium transition-all ${
                              ideogramRenderingSpeed === speed
                                ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                : 'bg-[#0a0a0a] text-[#888] hover:text-white hover:bg-[#111] border border-[#1a1a1a]'
                            }`}
                          >
                            {speed}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Style</label>
                      <div className="flex gap-1">
                        {['AUTO', 'GENERAL', 'REALISTIC', 'DESIGN'].map((style) => (
                          <button
                            key={style}
                            onClick={() => setIdeogramStyle(style as any)}
                            className={`px-2 py-1.5 rounded text-[9px] font-medium transition-all ${
                              ideogramStyle === style
                                ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                : 'bg-[#0a0a0a] text-[#888] hover:text-white hover:bg-[#111] border border-[#1a1a1a]'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Qwen Settings */}
                {selectedModel === 'qwen' && (
                  <div className="flex items-end gap-4">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Size</label>
                      <select
                        value={qwenImageSize}
                        onChange={(e) => setQwenImageSize(e.target.value as any)}
                        className="px-3 py-1.5 rounded text-[10px] bg-[#0a0a0a] text-white border border-[#1a1a1a] focus:border-[var(--accent)] focus:outline-none"
                      >
                        {['square', 'square_hd', 'portrait_4_3', 'portrait_16_9', 'landscape_4_3', 'landscape_16_9'].map((size) => (
                          <option key={size} value={size}>{size.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Steps</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={qwenNumInferenceSteps}
                        onChange={(e) => setQwenNumInferenceSteps(parseInt(e.target.value) || 30)}
                        className="w-16 px-2 py-1.5 rounded text-[10px] bg-[#0a0a0a] text-white border border-[#1a1a1a] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Guidance</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={qwenGuidanceScale}
                        onChange={(e) => setQwenGuidanceScale(parseFloat(e.target.value) || 2.5)}
                        className="w-16 px-2 py-1.5 rounded text-[10px] bg-[#0a0a0a] text-white border border-[#1a1a1a] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Accel</label>
                      <div className="flex gap-1">
                        {['none', 'regular', 'high'].map((acc) => (
                          <button
                            key={acc}
                            onClick={() => setQwenAcceleration(acc as any)}
                            className={`px-2 py-1.5 rounded text-[9px] font-medium transition-all ${
                              qwenAcceleration === acc
                                ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                : 'bg-[#0a0a0a] text-[#888] hover:text-white hover:bg-[#111] border border-[#1a1a1a]'
                            }`}
                          >
                            {acc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Grok Imagine Settings */}
                {selectedModel === 'grok-imagine' && (
                  <div className="flex items-end gap-4 flex-wrap">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Mode</label>
                      <div className="flex gap-1">
                        {['fun', 'normal', 'spicy'].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setGrokImagineMode(mode as 'fun' | 'normal' | 'spicy')}
                            className={`px-2 py-1.5 rounded text-[9px] font-medium transition-all ${
                              grokImagineMode === mode
                                ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                : 'bg-[#0a0a0a] text-[#888] hover:text-white hover:bg-[#111] border border-[#1a1a1a]'
                            }`}
                          >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Image URL</label>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={grokImagineImageUrls[0] || ''}
                        onChange={(e) => setGrokImagineImageUrls(e.target.value ? [e.target.value] : [])}
                        className="w-48 px-2 py-1.5 rounded text-[10px] bg-[#0a0a0a] text-white border border-[#1a1a1a] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Task ID</label>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={grokImagineTaskId}
                        onChange={(e) => setGrokImagineTaskId(e.target.value)}
                        className="w-32 px-2 py-1.5 rounded text-[10px] bg-[#0a0a0a] text-white border border-[#1a1a1a] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                    {grokImagineTaskId && (
                      <div>
                        <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Index</label>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          value={grokImagineIndex}
                          onChange={(e) => setGrokImagineIndex(parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1.5 rounded text-[10px] bg-[#0a0a0a] text-white border border-[#1a1a1a] focus:border-[var(--accent)] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Nano Banana Pro Settings */}
                {selectedModel === 'nano-banan-pro' && (
                  <div className="flex items-end gap-4 flex-wrap">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Aspect</label>
                      <select
                        value={nanoBananaAspectRatio}
                        onChange={(e) => setNanoBananaAspectRatio(e.target.value as any)}
                        className="px-3 py-1.5 rounded text-[10px] bg-[#0a0a0a] text-white border border-[#1a1a1a] focus:border-[var(--accent)] focus:outline-none"
                      >
                        {['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9', 'auto'].map((ratio) => (
                          <option key={ratio} value={ratio}>{ratio}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Resolution</label>
                      <div className="flex gap-1">
                        {['1K', '2K', '4K'].map((res) => (
                          <button
                            key={res}
                            onClick={() => setNanoBananaResolution(res as '1K' | '2K' | '4K')}
                            className={`px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                              nanoBananaResolution === res
                                ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                : 'bg-[#0a0a0a] text-[#888] hover:text-white hover:bg-[#111] border border-[#1a1a1a]'
                            }`}
                          >
                            {res}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Format</label>
                      <div className="flex gap-1">
                        {['png', 'jpg'].map((format) => (
                          <button
                            key={format}
                            onClick={() => setNanoBananaOutputFormat(format as 'png' | 'jpg')}
                            className={`px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                              nanoBananaOutputFormat === format
                                ? 'bg-[var(--accent)] text-[#0a0a0a]'
                                : 'bg-[#0a0a0a] text-[#888] hover:text-white hover:bg-[#111] border border-[#1a1a1a]'
                            }`}
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider text-[#666] mb-1.5 block">Image Input</label>
                      <input
                        type="text"
                        placeholder="URLs (optional)"
                        value={nanoBananaImageInput.join(', ')}
                        onChange={(e) => setNanoBananaImageInput(e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(s => s) : [])}
                        className="w-48 px-2 py-1.5 rounded text-[10px] bg-[#0a0a0a] text-white border border-[#1a1a1a] focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
