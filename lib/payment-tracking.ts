/**
 * Payment Tracking System
 * Tracker payment information for hver generation task, så vi kan refunde hvis det fejler
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
// Key: taskId, Value: PaymentInfo
const paymentTracking = new Map<string, PaymentInfo>();

/**
 * Gemmer payment information for et task
 */
export function trackPayment(info: PaymentInfo): void {
  console.log('📝 Tracking payment for task:', info.taskId);
  console.log('   User wallet:', info.userWallet);
  console.log('   Amount:', info.amount, 'USD');
  console.log('   Payment method:', info.paymentMethod);
  console.log('   Payment signature:', info.paymentSignature);
  console.log('   Model:', info.model);
  
  paymentTracking.set(info.taskId, info);
  
  console.log('💾 Payment tracking Map size:', paymentTracking.size);
  console.log('💾 All tracked taskIds:', Array.from(paymentTracking.keys()));
  
  // Auto-cleanup after 24 hours
  setTimeout(() => {
    paymentTracking.delete(info.taskId);
    console.log('🗑️ Auto-cleaned payment tracking for task:', info.taskId);
  }, 24 * 60 * 60 * 1000);
}

/**
 * Henter payment information for et task
 */
export function getPaymentInfo(taskId: string): PaymentInfo | undefined {
  console.log('🔍 Looking for payment info - taskId:', taskId);
  console.log('💾 Current Map size:', paymentTracking.size);
  console.log('💾 All tracked taskIds:', Array.from(paymentTracking.keys()));
  
  const info = paymentTracking.get(taskId);
  console.log('📋 Found payment info:', info ? 'YES' : 'NO');
  if (info) {
    console.log('   Payment info:', JSON.stringify(info, null, 2));
  }
  
  return info;
}

/**
 * Fjerner payment tracking når task er completed successfully
 */
export function clearPaymentTracking(taskId: string): void {
  paymentTracking.delete(taskId);
  console.log('✅ Cleared payment tracking for completed task:', taskId);
}

/**
 * Henter alle tracked payments (til debugging)
 */
export function getAllTrackedPayments(): PaymentInfo[] {
  return Array.from(paymentTracking.values());
}

