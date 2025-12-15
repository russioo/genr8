'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Wallet, RefreshCw } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { sendUSDCPayment, getTokenPriceUSD, calculateTokenAmount } from '@/lib/solana-payment';
import { sendDirectUSDCPayment } from '@/lib/usdc-payment';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  modelName: string;
  generationId: string;
  onPaymentComplete: (signature: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  modelName,
  generationId,
  onPaymentComplete,
}: PaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'error'>('pending');
  const [isVisible, setIsVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionSignature, setTransactionSignature] = useState('');
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [genAmount, setPayperAmount] = useState<number>(0);
  const [priceSource, setPriceSource] = useState<string>('');
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'gen' | 'usdc'>('gen');
  const [usdcAmount, setUsdcAmount] = useState<number>(0);
  
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  // Hent aktuel token pris
  const fetchTokenPrice = async () => {
    setIsLoadingPrice(true);
    try {
      const priceInfo = await getTokenPriceUSD();
      setTokenPrice(priceInfo.priceUSD);
      setPriceSource(priceInfo.source);
      
      // Calculate token amount
      const calculated = await calculateTokenAmount(amount);
      setPayperAmount(calculated.tokenAmount);
      
      console.log('💰 Token price fetched:', priceInfo.priceUSD, priceInfo.source);
      console.log('💳 Total amount:', calculated.tokenAmount, '$GEN');
      
      // Calculate USDC price (4x markup)
      const usdcAmount = amount * 4;
      setUsdcAmount(usdcAmount);
      console.log('💵 USDC amount:', usdcAmount.toFixed(3), 'USDC');
    } catch (error) {
      console.error('Error fetching token price:', error);
      // Fallback
      setTokenPrice(0.0001);
      setPayperAmount(Math.floor(amount / 0.0001));
      setUsdcAmount(amount * 4);
      setPriceSource('Fallback');
    } finally {
      setIsLoadingPrice(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setPaymentStatus('pending');
      setErrorMessage('');
      setTransactionSignature('');
      setIsLoadingPrice(true);
      fetchTokenPrice();
    } else {
      setTimeout(() => setIsVisible(false), 400);
    }
  }, [isOpen, amount]);

  const handlePayment = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setErrorMessage('Please connect your wallet first');
      return;
    }
    
    if (paymentMethod === 'gen' && genAmount === 0) {
      setErrorMessage('Please wait for price to load');
      return;
    }

    if (paymentMethod === 'usdc' && usdcAmount === 0) {
      setErrorMessage('Please wait for price to load');
      return;
    }

    setPaymentStatus('processing');
    setErrorMessage('');
    
    try {
      if (paymentMethod === 'gen') {
        console.log('💳 Starting $GEN payment:', Math.floor(genAmount), '$GEN for', amount, 'USD');
        
        // Send $GEN token payment via Solana
        const result = await sendUSDCPayment(
          connection,
          publicKey,
          signTransaction,
          amount
        );

        if (result.success && result.signature) {
          console.log('✅ Payment successful!');
          console.log('Signature:', result.signature);
          
          setTransactionSignature(result.signature);
          setPaymentStatus('completed');
          
          // Wait a bit and call onPaymentComplete with signature
          setTimeout(() => {
            onPaymentComplete(result.signature);
            onClose();
          }, 2000);
        } else {
          console.error('❌ Payment failed:', result.error);
          setPaymentStatus('error');
          setErrorMessage(result.error || 'Payment failed. Please try again.');
        }
      } else {
        console.log('💵 Starting USDC payment:', usdcAmount.toFixed(3), 'USDC');
        
        // Send USDC payment
        const result = await sendDirectUSDCPayment(
          connection,
          publicKey,
          signTransaction,
          usdcAmount
        );

        if (result.success && result.signature) {
          console.log('✅ USDC Payment successful!');
          console.log('Signature:', result.signature);
          
          setTransactionSignature(result.signature);
          setPaymentStatus('completed');
          
          // Wait a bit and call onPaymentComplete with signature
          setTimeout(() => {
            onPaymentComplete(result.signature);
            onClose();
          }, 2000);
        } else {
          console.error('❌ USDC Payment failed:', result.error);
          setPaymentStatus('error');
          setErrorMessage(result.error || 'USDC payment failed. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'An error occurred. Please try again.');
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 transition-all duration-400 ease-out ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && paymentStatus !== 'processing') {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl z-0" />

      {/* Modal */}
      <div 
        className={`relative z-10 w-full max-w-md md:max-w-lg bg-white rounded-3xl shadow-xl transition-all duration-600 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-all duration-300 group disabled:opacity-30"
          disabled={paymentStatus === 'processing'}
        >
          <X className="w-5 h-5 text-black/30 group-hover:text-black/70 transition-colors duration-300" />
        </button>

        {/* Content */}
        <div className="px-5 sm:px-8 py-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mb-4">
              <div className={`inline-block transition-all duration-700 ${
                paymentStatus === 'processing'
                  ? 'scale-110 opacity-100'
                  : 'scale-100 opacity-100'
              }`}>
                {paymentStatus === 'processing' ? (
                  <Loader2 className="w-10 h-10 text-black animate-spin" />
                ) : paymentStatus === 'error' ? (
                  <div className="w-10 h-10 border-2 border-red-500/30 rounded-full flex items-center justify-center">
                    <X className="w-5 h-5 text-red-500" />
                  </div>
                ) : (
                  <Wallet className="w-10 h-10 text-black/20" />
                )}
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-extralight mb-2 tracking-tight text-black">
              {paymentStatus === 'completed' 
                ? 'Payment Complete' 
                : paymentStatus === 'processing'
                ? 'Processing Payment'
                : paymentStatus === 'error'
                ? 'Payment Failed'
                : 'Payment'}
            </h2>
            <p className="text-xs text-black/40 font-light tracking-wide">
              {paymentStatus === 'completed' 
                ? 'Your generation is starting now' 
                : paymentStatus === 'processing'
                ? 'Confirming transaction on Solana'
                : paymentStatus === 'error'
                ? errorMessage
                : 'Pay via your Solana wallet'}
            </p>
          </div>

          {/* Payment Details - Slide out when completed */}
          <div className={`space-y-8 transition-all duration-700 ${
            paymentStatus === 'completed' || paymentStatus === 'error'
              ? 'opacity-0 -translate-y-4 max-h-0 overflow-hidden pointer-events-none' 
              : 'opacity-100 translate-y-0 max-h-[600px]'
          }`}>
            {/* Payment Method Selector */}
            <div className="space-y-2">
              <div className="text-center">
                <p className="text-xs font-medium text-black/60 mb-1">Choose Payment Method</p>
                <p className="text-[10px] text-black/40">
                  USDC is 4x more expensive than $GENR8
                </p>
              </div>
              <div className="flex gap-2 p-1 bg-black/5 rounded-xl">
                <button
                  onClick={() => setPaymentMethod('gen')}
                  disabled={isLoadingPrice || paymentStatus === 'processing' || paymentStatus === 'completed'}
                  className={`relative flex-1 py-3 px-4 rounded-lg text-xs font-semibold uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    paymentMethod === 'gen'
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-transparent text-black/40 hover:text-black/60'
                  }`}
                >
                  $GENR8
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                    BEST
                  </span>
                  <span className="block text-[9px] font-normal mt-1 opacity-70">Standard Price</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('usdc')}
                  disabled={isLoadingPrice || paymentStatus === 'processing' || paymentStatus === 'completed'}
                  className={`relative flex-1 py-3 px-4 rounded-lg text-xs font-semibold uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    paymentMethod === 'usdc'
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-transparent text-black/40 hover:text-black/60'
                  }`}
                >
                  USDC
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                    4x
                  </span>
                  <span className="block text-[9px] font-normal mt-1 opacity-70">Premium Price</span>
                </button>
              </div>
            </div>

            {/* Amount Display */}
            <div className="py-6 border border-black/10 rounded-2xl bg-black/[0.015] text-center">
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="text-4xl sm:text-5xl font-extralight tabular-nums text-black tracking-tight">
                {isLoadingPrice ? (
                    <Loader2 className="w-12 h-12 animate-spin text-black/20" />
                ) : paymentMethod === 'gen' ? (
                  Math.floor(genAmount)
                ) : (
                  usdcAmount.toFixed(3)
                )}
              </div>
                <div className="text-[10px] sm:text-[11px] text-black/30 uppercase tracking-[0.28em] font-light">
                  {paymentMethod === 'gen' ? '$GENR8 on Solana' : 'USDC on Solana'}
                </div>
              
              {/* Token Price Info */}
              {!isLoadingPrice && paymentMethod === 'gen' && tokenPrice && (
                  <div className="flex items-center justify-center gap-2 mt-1.5">
                    <div className="text-[11px] sm:text-xs text-black/40 font-light">
                    1 $GENR8 = ${tokenPrice.toFixed(6)} USD
                    {priceSource && (
                        <span className="ml-1.5 text-black/25">({priceSource})</span>
                    )}
                  </div>
                  <button
                    onClick={fetchTokenPrice}
                    disabled={isLoadingPrice}
                    className="p-1.5 hover:bg-black/5 rounded transition-all group"
                    title="Refresh price"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-black/30 group-hover:text-black/50 transition-all ${
                      isLoadingPrice ? 'animate-spin' : ''
                    }`} />
                  </button>
                </div>
              )}
              {!isLoadingPrice && paymentMethod === 'usdc' && (
                <div className="text-[11px] sm:text-xs text-black/40 font-light mt-1.5">
                  1 USDC = $1.00 USD
                </div>
              )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-baseline py-3">
                <span className="text-black/30 font-light uppercase text-xs tracking-wider">Base Price</span>
                <span className="text-black font-light">${amount.toFixed(3)}</span>
              </div>
              {paymentMethod === 'usdc' && (
                <div className="flex justify-between items-baseline py-3">
                  <span className="text-black/30 font-light uppercase text-xs tracking-wider">Premium (4x)</span>
                  <span className="text-black font-light">${(amount * 4).toFixed(3)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline py-3 border-b border-black/5">
                <span className="text-black/30 font-light uppercase text-xs tracking-wider">Total Payment</span>
                <span className="text-black font-light">
                  {paymentMethod === 'gen' 
                    ? `${Math.floor(genAmount)} $GENR8` 
                    : `${usdcAmount.toFixed(3)} USDC`}
                </span>
              </div>
              <button
                onClick={() => setShowDetails((prev) => !prev)}
                className="mt-2 w-full text-left text-[11px] uppercase tracking-[0.22em] text-black/35 hover:text-black/60 transition-colors flex items-center justify-between"
              >
                More details
                <span className="text-black/40 text-sm font-light">
                  {showDetails ? '-' : '+'}
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-400 ease-out ${
                  showDetails ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-1 border-t border-black/5 pt-2 text-sm">
                  <div className="flex justify-between items-baseline py-2">
                    <span className="text-black/30 font-light uppercase text-[11px] tracking-wider">Model</span>
                <span className="text-black font-light">{modelName}</span>
              </div>
                  <div className="flex justify-between items-baseline py-2">
                    <span className="text-black/30 font-light uppercase text-[11px] tracking-wider">Network</span>
                <span className="text-black font-light">Solana Mainnet</span>
              </div>
              {connected && publicKey && (
                    <div className="flex justify-between items-baseline py-2">
                      <span className="text-black/30 font-light uppercase text-[11px] tracking-wider">Wallet</span>
                      <span className="text-black/40 font-mono text-[11px] tracking-tight">
                    {publicKey.toBase58().substring(0, 8)}...{publicKey.toBase58().substring(publicKey.toBase58().length - 6)}
                  </span>
                </div>
              )}
                </div>
              </div>
            </div>
          </div>

          {/* Success Message - Slide in when completed */}
          <div className={`transition-all duration-700 ${
            paymentStatus === 'completed' 
              ? 'opacity-100 translate-y-0 max-h-36 mb-8' 
              : 'opacity-0 translate-y-6 max-h-0 overflow-hidden pointer-events-none'
          }`}>
            <div className="py-6 border-t border-b border-black/10 text-center space-y-3">
              <p className="text-sm text-black/60 font-light">
                Generating your content...
              </p>
              {transactionSignature && (
                <a 
                  href={`https://solscan.io/tx/${transactionSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-black/60 hover:text-black font-mono transition-colors underline"
                >
                  View transaction on Solscan →
                </a>
              )}
            </div>
          </div>

          {/* Error Message */}
          {paymentStatus === 'error' && (
            <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-xl space-y-3">
              <div>
                <p className="font-semibold text-red-700 text-xs">Payment Failed</p>
                <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
              </div>
              <button
                onClick={() => {
                  setPaymentStatus('pending');
                  setErrorMessage('');
                }}
                className="w-full py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Action Button */}
          {!connected ? (
            <div className="text-center py-8 border-t border-black/10">
              <p className="text-sm text-black/40 mb-4">You need to connect your wallet first</p>
              <p className="text-xs text-black/30">Use the "Connect Wallet" button in the header</p>
            </div>
          ) : (
            <button
              onClick={(e) => {
                console.log('🖱️ CLICKED!');
                console.log('disabled?', e.currentTarget.disabled);
                console.log('isLoadingPrice?', isLoadingPrice);
                console.log('paymentStatus?', paymentStatus);
                console.log('genAmount?', genAmount);
                if (!e.currentTarget.disabled) {
                  handlePayment();
                }
              }}
              onMouseEnter={() => console.log('🖱️ Mouse enter')}
              disabled={isLoadingPrice || paymentStatus === 'processing' || paymentStatus === 'completed'}
              className={`relative z-10 w-full px-7 py-3.5 text-[11px] sm:text-sm font-light tracking-[0.18em] uppercase
                       flex items-center justify-center gap-4
                       transition-all duration-500 ease-out
                       pointer-events-auto
                       ${paymentStatus === 'completed'
                         ? 'bg-green-600 text-white cursor-default opacity-90'
                         : paymentStatus === 'processing' || isLoadingPrice
                         ? 'bg-black text-white cursor-wait opacity-80'
                         : paymentStatus === 'error'
                         ? 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]'
                         : 'bg-black text-white hover:bg-black/80 active:scale-[0.98] cursor-pointer'
                       }`}
            >
              {isLoadingPrice ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading Price...</span>
                </>
              ) : paymentStatus === 'processing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing</span>
                </>
              ) : paymentStatus === 'completed' ? (
                <span>Completed</span>
              ) : paymentStatus === 'error' ? (
                <span>Try Again</span>
              ) : (
                <span>
                  {paymentMethod === 'gen' 
                    ? `Pay ${Math.floor(genAmount)} $GENR8` 
                    : `Pay ${usdcAmount.toFixed(3)} USDC`}
                </span>
              )}
            </button>
          )}

          {/* Footer */}
          <div className={`mt-6 pt-6 border-t border-black/5 transition-opacity duration-500 ${
            paymentStatus === 'pending' || paymentStatus === 'error' ? 'opacity-100' : 'opacity-0'
          }`}>
            <p className="text-[9px] text-center text-black/25 uppercase tracking-[0.28em] font-light">
              Secured by Solana Network
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

