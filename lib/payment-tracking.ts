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
 * Clears payment tracking when task is completed
 */
export function clearPaymentTracking(taskId: string): void {
  paymentTracking.delete(taskId);
}

