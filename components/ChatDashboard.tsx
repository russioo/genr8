'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Plus, ArrowUpRight, Trash2, Sparkles, Zap, Image, Video, Send } from 'lucide-react';

import { imageModels, videoModels } from '@/lib/models';
import ResultDisplay from '@/components/ResultDisplay';
import GenerationProgress from '@/components/GenerationProgress';
import { sendUSDCPayment } from '@/lib/solana-payment';

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

const defaultGenerationProgress = {
  elapsedTime: 0,
  status: 'pending' as 'pending' | 'processing' | 'completed',
  estimatedTime: 150,
};

const POLLING_MODELS = new Set(['sora-2', 'veo-3.1', 'gpt-image-1', 'ideogram', 'qwen']);

const getEstimatedTime = (modelId: string, options?: Record<string, any>) => {
  switch (modelId) {
    case 'gpt-image-1': return options?.filesUrl?.length > 0 ? 150 : 120;
    case 'ideogram': return options?.renderingSpeed === 'QUALITY' ? 90 : options?.renderingSpeed === 'TURBO' ? 30 : 60;
    case 'qwen': return options?.acceleration === 'high' ? 25 : options?.acceleration === 'regular' ? 35 : 45;
    case 'veo-3.1': return options?.imageUrls?.length > 0 ? 90 : 50;
    case 'sora-2': return options?.n_frames === '15' ? 240 : 150;
    default: return 150;
  }
};

export default function ChatDashboard() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const walletAddress = publicKey?.toBase58();

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [prompt, setPrompt] = useState('');
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image');
  const [selectedModel, setSelectedModel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(defaultGenerationProgress);
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paymentMethodByGenId, setPaymentMethodByGenId] = useState<Map<string, 'gen' | 'usdc'>>(new Map());

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!modelMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) setModelMenuOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [modelMenuOpen]);

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
    setGenerationProgress((p) => ({ ...p, status: 'completed' }));
    return resultPayload;
  }, [appendMessage, generationType]);

  const startPolling = useCallback(async ({ taskId, model, prompt, chatId, options, userWallet, paymentMethod, amountPaidUSD }: any) => {
    return new Promise<void>((resolve) => {
      const estimatedTime = getEstimatedTime(model.id, options);
      setGenerationProgress({ elapsedTime: 0, status: 'processing', estimatedTime });
      const startTime = Date.now();
      const timeInterval = window.setInterval(() => setGenerationProgress((p) => ({ ...p, elapsedTime: Math.floor((Date.now() - startTime) / 1000) })), 1000);
      const cleanup = (action?: () => void) => { window.clearInterval(timeInterval); window.clearInterval(pollInterval); window.clearTimeout(timeoutId); action?.(); resolve(); };
      const poll = async () => {
        try {
          const r = await axios.get(`/api/generate/${taskId}?model=${model.id}`, { headers: { 'X-User-Wallet': userWallet || walletAddress || '', 'X-Payment-Method': paymentMethod || 'gen', 'X-Amount-Paid': amountPaidUSD?.toString() || '' } });
          if (r.data.success && r.data.state === 'completed') {
            cleanup(async () => {
              setGenerationProgress({ elapsedTime: 0, status: 'completed', estimatedTime: 0 });
              const outcome = await handleGenerationSuccess(r.data, { prompt, model, chatId, options });
              if (outcome) setLatestResult(outcome);
              setIsGenerating(false);
            });
          } else if (r.data.state === 'failed') {
            cleanup(async () => {
              setGenerationProgress({ elapsedTime: 0, status: 'completed', estimatedTime: 0 });
              let err = r.data.errorMessage || r.data.message || 'Generation failed';
              if (r.data.refunded && r.data.refundSignature) err += `\n\nRefunded ${r.data.refundAmount?.toFixed(3)} USD in ${r.data.refundToken}.`;
              await addStatusMessage(chatId, 'error', { errorMessage: err, modelId: model.id, modelName: model.name, prompt, refunded: r.data.refunded, refundSignature: r.data.refundSignature });
              setIsGenerating(false);
            });
          }
        } catch (error: any) {
          const ed = error?.response?.data || {};
          if (ed.state === 'failed' || (typeof ed.errorMessage === 'string' && ed.errorMessage.toLowerCase().includes('flagged'))) {
            cleanup(async () => {
              setGenerationProgress({ elapsedTime: 0, status: 'completed', estimatedTime: 0 });
              let err = ed.errorMessage || 'Generation failed.';
              if (ed.refunded && ed.refundSignature) err += `\n\nRefunded ${ed.refundAmount?.toFixed(3)} USD in ${ed.refundToken}.`;
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

  const handleGenerate = useCallback(async (chatId: string, promptText: string, options?: any) => {
    if (!selectedModel) { alert('Select a model'); return; }
    const model = currentModels.find((m) => m.id === selectedModel);
    if (!model) { alert('Model not found'); return; }
    if (!connected || !walletAddress) { alert('Connect wallet first'); return; }
    setIsGenerating(true);
    setGenerationProgress(defaultGenerationProgress);
    await addStatusMessage(chatId, 'pending', { modelId: model.id, modelName: model.name, generationType, prompt: promptText });
    try {
      const response = await axios.post('/api/generate', { model: selectedModel, prompt: promptText, type: generationType, options });
      if (response?.data?.success) {
        const needsPolling = POLLING_MODELS.has(model.id) && response.data.taskId;
        if (needsPolling) {
          await addStatusMessage(chatId, 'processing', { modelId: model.id, modelName: model.name, generationType, prompt: promptText });
          await startPolling({ taskId: response.data.taskId, model, prompt: promptText, chatId, options, userWallet: walletAddress, paymentMethod: 'gen' });
        } else {
          const resultData = await handleGenerationSuccess(response.data, { prompt: promptText, model, chatId, options });
          if (resultData) setLatestResult(resultData);
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 402 || error?.response?.data?.paymentRequired) {
        const data = error.response.data;
        await appendMessage(chatId, { role: 'system', metadata: { type: 'paymentRequest', amountUSD: data.amount, modelId: model.id, modelName: model.name, generationId: data.generationId, prompt: promptText, generationType, options, chatId } });
      } else {
        const errMsg = error?.response?.data?.message || error?.message || 'Unknown error';
        await addStatusMessage(chatId, 'error', { errorMessage: errMsg, modelId: selectedModel, prompt: prompt.trim() });
      }
    } finally {
      setIsGenerating(false);
    }
  }, [selectedModel, generationType, connected, walletAddress, currentModels, addStatusMessage, startPolling, handleGenerationSuccess, appendMessage, prompt]);

  const completeGenerationAfterPayment = useCallback(async (metadata: any, signature: string) => {
    const model = [...imageModels, ...videoModels].find((m) => m.id === metadata.modelId);
    if (!model) return;
    try {
      setIsGenerating(true);
      setGenerationProgress(defaultGenerationProgress);
      const paymentMethod = metadata.generationId ? paymentMethodByGenId.get(metadata.generationId) || 'gen' : 'gen';
      const amountPaidUSD = paymentMethod === 'usdc' ? metadata.amountUSD * 4 : metadata.amountUSD;
      const response = await axios.post('/api/generate', { model: model.id, prompt: metadata.prompt, type: metadata.generationType, options: metadata.options || {}, paymentSignature: signature, userWallet: walletAddress, paymentMethod, amountPaidUSD });
      if (response?.data?.success) {
        const needsPolling = POLLING_MODELS.has(model.id) && response.data.taskId;
        if (needsPolling) await startPolling({ taskId: response.data.taskId, model, prompt: metadata.prompt, chatId: metadata.chatId, options: metadata.options, userWallet: walletAddress, paymentMethod, amountPaidUSD });
        else { const resultData = await handleGenerationSuccess(response.data, { prompt: metadata.prompt, model, chatId: metadata.chatId, options: metadata.options }); if (resultData) setLatestResult(resultData); }
      } else await addStatusMessage(metadata.chatId, 'error', { errorMessage: response?.data?.message || 'Generation failed after payment.' });
    } catch (error) {
      await addStatusMessage(metadata.chatId, 'error', { errorMessage: 'Generation failed after payment.' });
    } finally {
      setIsGenerating(false);
    }
  }, [addStatusMessage, handleGenerationSuccess, startPolling, walletAddress, paymentMethodByGenId]);

  const handlePaymentAction = useCallback(async (metadata: PaymentRequestMetadata) => {
    if (!connected || !publicKey || !connection || !signTransaction) { alert('Connect wallet first'); return; }
    const selectedMethod = paymentMethodByGenId.get(metadata.generationId) || 'gen';
    const baseAmount = metadata.amountUSD;
    const actualAmount = selectedMethod === 'usdc' ? baseAmount * 4 : baseAmount;
    setPayingGenerationId(metadata.generationId);
    await appendMessage(metadata.chatId, { role: 'system', metadata: { type: 'paymentStatus', status: 'processing', generationId: metadata.generationId, amountUSD: actualAmount, paymentMethod: selectedMethod } });
    try {
      let result;
      if (selectedMethod === 'usdc') { const { sendDirectUSDCPayment } = await import('@/lib/usdc-payment'); result = await sendDirectUSDCPayment(connection, publicKey, signTransaction, actualAmount); }
      else result = await sendUSDCPayment(connection, publicKey, signTransaction, baseAmount);
      if (!result.success || !result.signature) { await appendMessage(metadata.chatId, { role: 'system', metadata: { type: 'paymentStatus', status: 'error', generationId: metadata.generationId, errorMessage: result.error || 'Payment failed' } }); return; }
      await appendMessage(metadata.chatId, { role: 'system', metadata: { type: 'paymentStatus', status: 'completed', generationId: metadata.generationId, transactionSignature: result.signature } });
      await addStatusMessage(metadata.chatId, 'processing', { modelId: metadata.modelId, modelName: metadata.modelName, generationType: metadata.generationType, prompt: metadata.prompt });
      await completeGenerationAfterPayment({ ...metadata }, result.signature);
    } catch (error: any) {
      await appendMessage(metadata.chatId, { role: 'system', metadata: { type: 'paymentStatus', status: 'error', generationId: metadata.generationId, errorMessage: error?.message || 'Payment error' } });
    } finally {
      setPayingGenerationId(null);
    }
  }, [appendMessage, completeGenerationAfterPayment, connection, connected, publicKey, signTransaction, paymentMethodByGenId, addStatusMessage]);

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim()) return;
    const chatId = await ensureActiveChat();
    if (!chatId) return;
    const userMessage = await appendMessage(chatId, { role: 'user', content: prompt.trim(), metadata: { type: 'prompt', generationType, modelId: selectedModel } });
    if (userMessage && !chats.find((c) => c.id === chatId)?.title) updateChatTitle(chatId, prompt.trim().slice(0, 64));
    setPrompt('');
    if (selectedModel) {
      const options: any = {};
      if (selectedModel === 'sora-2') { options.aspect_ratio = aspectRatio; options.n_frames = nFrames; options.remove_watermark = true; }
      else if (selectedModel === 'veo-3.1') { options.aspectRatio = veoAspectRatio; }
      else if (selectedModel === 'gpt-image-1') { options.size = image4oSize; options.nVariants = image4oVariants; }
      else if (selectedModel === 'ideogram') { options.image_size = ideogramImageSize; options.rendering_speed = ideogramRenderingSpeed; options.style = ideogramStyle; }
      else if (selectedModel === 'qwen') { options.image_size = qwenImageSize; options.num_inference_steps = qwenNumInferenceSteps; options.guidance_scale = qwenGuidanceScale; options.acceleration = qwenAcceleration; }
      await handleGenerate(chatId, userMessage?.content || prompt.trim(), options);
    }
  }, [prompt, ensureActiveChat, appendMessage, generationType, selectedModel, handleGenerate, chats, updateChatTitle, aspectRatio, nFrames, veoAspectRatio, image4oSize, image4oVariants, ideogramImageSize, ideogramRenderingSpeed, ideogramStyle, qwenImageSize, qwenNumInferenceSteps, qwenGuidanceScale, qwenAcceleration]);

  const renderMessageContent = (message: ChatMessage) => {
    if (message.role === 'user') return (
      <div className="bg-[var(--accent)] text-[var(--bg)] px-5 py-3 max-w-xl font-medium">
        {message.content}
      </div>
    );
    const metadata = message.metadata || {};
    if (metadata.type === 'generation') return (
      <div className="bg-[#111] border border-[#222] p-4 max-w-md">
        <ResultDisplay type={metadata.generationType || generationType} url={metadata.result} urls={metadata.resultUrls} prompt={metadata.prompt || ''} modelName={metadata.modelName || ''} onShare={() => handleShare(metadata.result, metadata.resultUrls)} />
        {metadata.transactionSignature && (
          <a href={`https://solscan.io/tx/${metadata.transactionSignature}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
            View tx <ArrowUpRight className="w-3 h-3" />
          </a>
        )}
      </div>
    );
    if (metadata.type === 'paymentRequest') {
      const request = metadata as PaymentRequestMetadata;
      const selectedPaymentMethod = paymentMethodByGenId.get(request.generationId) || 'gen';
      const handlePaymentMethodChange = (method: 'gen' | 'usdc') => setPaymentMethodByGenId(prev => { const m = new Map(prev); m.set(request.generationId, method); return m; });
      const paying = payingGenerationId === request.generationId || isGenerating;
      const paymentStatus = paymentStatusByGenerationId.get(request.generationId);
      const isCompleted = paymentStatus === 'completed';
      const isProcessing = paymentStatus === 'processing';
      const isErrored = paymentStatus === 'error';
      const isDisabled = isCompleted || isProcessing || paying || isGenerating;
      const baseAmount = request.amountUSD ?? 0;
      const displayAmount = selectedPaymentMethod === 'gen' ? baseAmount : baseAmount * 4;
      return (
        <div className="bg-[#111] border border-[#222] p-6 max-w-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent)]/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="font-semibold">Payment Required</p>
              <p className="text-sm text-[var(--muted)]">{request.modelName}</p>
            </div>
          </div>
          {!isCompleted && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handlePaymentMethodChange('gen')} disabled={isDisabled} className={`py-4 text-center transition-all ${selectedPaymentMethod === 'gen' ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[#1a1a1a] text-[var(--muted)] hover:bg-[#222]'}`}>
                <span className="block text-lg font-bold">${baseAmount.toFixed(3)}</span>
                <span className="block text-xs opacity-70">$GEN</span>
              </button>
              <button onClick={() => handlePaymentMethodChange('usdc')} disabled={isDisabled} className={`py-4 text-center transition-all ${selectedPaymentMethod === 'usdc' ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[#1a1a1a] text-[var(--muted)] hover:bg-[#222]'}`}>
                <span className="block text-lg font-bold">${(baseAmount * 4).toFixed(3)}</span>
                <span className="block text-xs opacity-70">USDC</span>
              </button>
            </div>
          )}
          <button onClick={() => handlePaymentAction(request)} disabled={isDisabled} className={`w-full py-4 font-semibold transition-all ${isCompleted ? 'bg-green-500/20 text-green-400' : isDisabled ? 'bg-[#1a1a1a] text-[var(--muted)]' : 'bg-[var(--accent)] text-[var(--bg)] hover:brightness-110'}`}>
            {isCompleted ? '✓ Paid' : isProcessing || paying ? 'Processing...' : isErrored ? 'Retry Payment' : `Pay $${displayAmount.toFixed(3)}`}
          </button>
        </div>
      );
    }
    if (metadata.type === 'paymentStatus') {
      if (metadata.status === 'processing') return <div className="bg-[#111] border border-[#222] text-sm text-[var(--muted)] px-5 py-3 flex items-center gap-3"><div className="w-4 h-4 border-2 border-[var(--dim)] border-t-[var(--accent)] rounded-full animate-spin" />Processing payment...</div>;
      if (metadata.status === 'completed') return <div className="bg-green-500/10 border border-green-500/20 px-5 py-3"><p className="text-green-400 font-medium">Payment confirmed</p>{metadata.transactionSignature && <a href={`https://solscan.io/tx/${metadata.transactionSignature}`} target="_blank" rel="noopener noreferrer" className="text-green-400/70 hover:text-green-400 text-sm flex items-center gap-1 mt-1">View on Solscan <ArrowUpRight className="w-3 h-3" /></a>}</div>;
      if (metadata.status === 'error') return <div className="bg-red-500/10 border border-red-500/20 px-5 py-3"><p className="text-red-400 font-medium">Payment Failed</p><p className="text-red-400/70 text-sm mt-1">{metadata.errorMessage || 'Please try again.'}</p></div>;
    }
    if (metadata.type === 'status') {
      if (metadata.status === 'processing') {
        const hasResult = messages.some(m => m.metadata?.type === 'generation' && m.metadata?.prompt === metadata.prompt && m.created_at > message.created_at);
        const hasError = messages.some(m => m.metadata?.type === 'status' && m.metadata?.status === 'error' && m.metadata?.prompt === metadata.prompt && m.created_at > message.created_at);
        if (hasResult || hasError) return null;
        return <div className="bg-[#111] border border-[#222] p-5 max-w-md"><GenerationProgress status="processing" elapsedTime={generationProgress.elapsedTime} estimatedTotal={generationProgress.estimatedTime} type={metadata.generationType || generationType} /></div>;
      }
      if (metadata.status === 'error') return <div className={`${metadata.refunded ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20'} border px-5 py-3 max-w-md`}><p className={`${metadata.refunded ? 'text-orange-400' : 'text-red-400'} font-medium`}>{metadata.refunded ? 'Failed — Refunded' : 'Generation Failed'}</p><p className={`${metadata.refunded ? 'text-orange-400/70' : 'text-red-400/70'} text-sm mt-1 whitespace-pre-wrap`}>{metadata.errorMessage}</p>{metadata.refundSignature && <a href={`https://solscan.io/tx/${metadata.refundSignature}`} target="_blank" rel="noopener noreferrer" className="text-orange-400/70 hover:text-orange-400 text-sm flex items-center gap-1 mt-2">View refund <ArrowUpRight className="w-3 h-3" /></a>}</div>;
      if (metadata.status === 'pending') return <div className="bg-[#111] border border-[#222] px-5 py-3 flex items-center gap-3"><div className="w-4 h-4 border-2 border-[var(--dim)] border-t-[var(--accent)] rounded-full animate-spin" /><span className="text-[var(--muted)]">Queued: {metadata.modelName}</span></div>;
    }
    if (typeof message.content === 'string' && message.content.trim()) return <div className="bg-[#111] border border-[#222] px-5 py-3 max-w-lg">{message.content}</div>;
    return null;
  };

  // Not connected state
  if (!connected) return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Main content */}
        <div className="text-center mb-16">
          <p className="text-xs text-[var(--accent)] tracking-widest uppercase mb-6">Get Started</p>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Create with<br /><span className="text-[var(--accent)]">AI</span>
          </h1>
          <p className="text-[var(--muted)] text-lg max-w-md mx-auto">
            Connect your wallet to generate images and videos with the best AI models.
          </p>
        </div>

        {/* Connect button */}
        <div className="flex justify-center mb-16">
          <WalletMultiButton />
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: '6+ Models', sub: 'GPT-4o, Sora, Veo' },
            { label: 'From $0.01', sub: 'Per generation' },
            { label: 'No Subs', sub: 'Pay per use' },
          ].map((item, i) => (
            <div key={i} className="p-4 border border-[var(--dim)] rounded-xl">
              <p className="font-semibold mb-1">{item.label}</p>
              <p className="text-xs text-[var(--muted)]">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[var(--bg)]">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#1a1a1a] flex flex-col">
        <div className="p-4 border-b border-[#1a1a1a]">
          <button onClick={createChat} className="w-full py-3 bg-[var(--accent)] text-[var(--bg)] font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all">
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>
        
        <div className="p-4 border-b border-[#1a1a1a]">
          <p className="text-xs text-[var(--muted)] mb-2">WALLET</p>
          <p className="mono text-sm">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <p className="px-4 py-3 text-xs text-[var(--muted)]">SESSIONS</p>
          {loadingChats ? (
            <div className="px-4 py-2 text-sm text-[var(--muted)]">Loading...</div>
          ) : chats.length === 0 ? (
            <div className="px-4 py-2 text-sm text-[var(--muted)]">No sessions yet</div>
          ) : (
            <ul>
              {chats.map((chat) => (
                <li key={chat.id} className={`group flex items-center border-l-2 transition-all ${chat.id === activeChatId ? 'bg-[#111] border-[var(--accent)]' : 'border-transparent hover:bg-[#0a0a0a]'}`}>
                  <button onClick={() => setActiveChatId(chat.id)} className="flex-1 text-left px-4 py-3">
                    <p className={`text-sm truncate ${chat.id === activeChatId ? 'text-white' : 'text-[var(--muted)]'}`}>{chat.title || 'Untitled'}</p>
                    <p className="text-xs text-[var(--dim)] mono mt-1">{new Date(chat.created_at).toLocaleDateString()}</p>
                  </button>
                  <button onClick={() => deleteChat(chat.id)} className="px-3 opacity-0 group-hover:opacity-100 text-[var(--dim)] hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full text-[var(--muted)]">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 border border-[var(--dim)] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[var(--dim)]" />
                </div>
                <p className="text-xl font-semibold mb-2">Start generating</p>
                <p className="text-[var(--muted)]">Select a model and enter your prompt</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
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

        {/* Input area */}
        <div className="border-t border-[#1a1a1a] p-4">
          <div className="max-w-4xl mx-auto">
            {/* Type & Model selector */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex bg-[#111] border border-[#222]">
                <button onClick={() => { setGenerationType('image'); setSelectedModel(''); }} className={`px-4 py-2 flex items-center gap-2 transition-all ${generationType === 'image' ? 'bg-[var(--accent)] text-[var(--bg)]' : 'text-[var(--muted)] hover:text-white'}`}>
                  <Image className="w-4 h-4" />
                  <span className="text-sm font-medium">Image</span>
                </button>
                <button onClick={() => { setGenerationType('video'); setSelectedModel(''); }} className={`px-4 py-2 flex items-center gap-2 transition-all ${generationType === 'video' ? 'bg-[var(--accent)] text-[var(--bg)]' : 'text-[var(--muted)] hover:text-white'}`}>
                  <Video className="w-4 h-4" />
                  <span className="text-sm font-medium">Video</span>
                </button>
              </div>

              <div className="relative flex-1" ref={modelMenuRef}>
                <button onClick={() => setModelMenuOpen(!modelMenuOpen)} className="w-full px-4 py-2 bg-[#111] border border-[#222] text-left flex items-center justify-between hover:border-[var(--dim)] transition-colors">
                  {activeModel ? (
                    <>
                      <span className="font-medium">{activeModel.name}</span>
                      <span className="text-[var(--accent)] mono">${activeModel.price.toFixed(3)}</span>
                    </>
                  ) : (
                    <span className="text-[var(--muted)]">Select model...</span>
                  )}
                </button>
                {modelMenuOpen && (
                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#0a0a0a] border border-[#222] z-50 max-h-64 overflow-y-auto">
                    {currentModels.map((model) => (
                      <button key={model.id} onClick={() => { setSelectedModel(model.id); setModelMenuOpen(false); }} className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${selectedModel === model.id ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'hover:bg-[#111]'}`}>
                        <span className="font-medium">{model.name}</span>
                        <span className="mono text-sm">${model.price.toFixed(3)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Prompt input */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Describe what you want to generate..."
                rows={3}
                className="w-full bg-[#111] border border-[#222] px-4 py-3 pr-14 resize-none focus:outline-none focus:border-[var(--accent)] transition-colors"
                disabled={isGenerating}
              />
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || !selectedModel || isGenerating}
                className={`absolute right-3 bottom-3 w-10 h-10 flex items-center justify-center transition-all ${!prompt.trim() || !selectedModel || isGenerating ? 'bg-[#222] text-[var(--dim)]' : 'bg-[var(--accent)] text-[var(--bg)] hover:brightness-110'}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Model settings */}
            {selectedModel && (
              <div className="mt-3">
                <button onClick={() => setSettingsOpen(!settingsOpen)} className="text-sm text-[var(--muted)] hover:text-white flex items-center gap-2 transition-colors">
                  <span>Settings</span>
                  <span className={`transition-transform ${settingsOpen ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {settingsOpen && (
                  <div className="mt-3 p-4 bg-[#111] border border-[#222] space-y-3">
                    {selectedModel === 'sora-2' && (
                      <>
                        <div className="flex gap-2">
                          {['landscape', 'portrait'].map((ar) => (
                            <button key={ar} onClick={() => setAspectRatio(ar as any)} className={`flex-1 py-2 text-sm font-medium transition-all ${aspectRatio === ar ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[#1a1a1a] text-[var(--muted)]'}`}>
                              {ar === 'landscape' ? '16:9' : '9:16'}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {['10', '15'].map((f) => (
                            <button key={f} onClick={() => setNFrames(f as any)} className={`flex-1 py-2 text-sm font-medium transition-all ${nFrames === f ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[#1a1a1a] text-[var(--muted)]'}`}>
                              {f === '10' ? '5 sec' : '10 sec'}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {selectedModel === 'veo-3.1' && (
                      <div className="flex gap-2">
                        {['16:9', '9:16'].map((ar) => (
                          <button key={ar} onClick={() => setVeoAspectRatio(ar as any)} className={`flex-1 py-2 text-sm font-medium transition-all ${veoAspectRatio === ar ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[#1a1a1a] text-[var(--muted)]'}`}>
                            {ar}
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedModel === 'gpt-image-1' && (
                      <>
                        <div className="flex gap-2">
                          {['1:1', '3:2', '2:3'].map((s) => (
                            <button key={s} onClick={() => setImage4oSize(s as any)} className={`flex-1 py-2 text-sm font-medium transition-all ${image4oSize === s ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[#1a1a1a] text-[var(--muted)]'}`}>
                              {s}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {[1, 2, 4].map((n) => (
                            <button key={n} onClick={() => setImage4oVariants(n as any)} className={`flex-1 py-2 text-sm font-medium transition-all ${image4oVariants === n ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[#1a1a1a] text-[var(--muted)]'}`}>
                              {n}x
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {selectedModel === 'ideogram' && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {['square_hd', 'portrait_4_3', 'landscape_4_3', 'landscape_16_9'].map((s) => (
                            <button key={s} onClick={() => setIdeogramImageSize(s as any)} className={`py-2 text-sm font-medium transition-all ${ideogramImageSize === s ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[#1a1a1a] text-[var(--muted)]'}`}>
                              {s.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {['TURBO', 'BALANCED', 'QUALITY'].map((sp) => (
                            <button key={sp} onClick={() => setIdeogramRenderingSpeed(sp as any)} className={`flex-1 py-2 text-sm font-medium transition-all ${ideogramRenderingSpeed === sp ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[#1a1a1a] text-[var(--muted)]'}`}>
                              {sp}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {selectedModel === 'qwen' && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {['square_hd', 'portrait_4_3', 'landscape_4_3', 'landscape_16_9'].map((s) => (
                            <button key={s} onClick={() => setQwenImageSize(s as any)} className={`py-2 text-sm font-medium transition-all ${qwenImageSize === s ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[#1a1a1a] text-[var(--muted)]'}`}>
                              {s.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {['none', 'regular', 'high'].map((a) => (
                            <button key={a} onClick={() => setQwenAcceleration(a as any)} className={`flex-1 py-2 text-sm font-medium capitalize transition-all ${qwenAcceleration === a ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[#1a1a1a] text-[var(--muted)]'}`}>
                              {a}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
