/**
 * Payment Tracking System
 * Tracks payment information for generation tasks
 */

export interface PaymentInfo {
  taskId: string;
  userWallet: string;
  amount: number;
  paymentMethod: 'gen' | 'usdc';
  paymentSignature: string;
  model: string;
  timestamp: Date;
  prompt?: string;
  type?: 'image' | 'video';
  resultUrl?: string;
}

// In-memory storage for payment tracking
const paymentTracking = new Map<string, PaymentInfo>();

/**
 * Tracks payment information for a task
 */
export function trackPayment(info: PaymentInfo): void {
  console.log('📝 Tracking payment for task:', info.taskId);
  paymentTracking.set(info.taskId, info);
  
  // Auto-cleanup after 24 hours
  setTimeout(() => {
    paymentTracking.delete(info.taskId);
  }, 24 * 60 * 60 * 1000);
}

/**
 * Gets payment info for a task
 */
export function getPaymentInfo(taskId: string): PaymentInfo | undefined {
  return paymentTracking.get(taskId);
}

/**
 * Clears payment tracking when task is completed
 */
export function clearPaymentTracking(taskId: string): PaymentInfo | undefined {
  const info = paymentTracking.get(taskId);
  paymentTracking.delete(taskId);
  return info;
}

