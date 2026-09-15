export type PaymentStatus = "Pending" | "Completed" | "Failed" | "Refunded";

export interface VNPayVerificationResult {
  isValid: boolean;
  isSuccess: boolean;
  bookingCode: string;
  amount: number;
  responseCode: string;
  transactionNo: string;
}
