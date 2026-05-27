export type VerificationStatus = "verified" | "fake" | "anomaly";

export interface BatchRegistrationInput {
  batchId: string;
  drugName: string;
  manufacturer: string;
  manufactureDate: string;
  expiryDate: string;
}

export interface BatchRecord extends BatchRegistrationInput {
  id: number;
  status: "pending_payment" | "registered";
  paymentHash: string | null;
  invoice: string | null;
  nostrEventId: string | null;
  createdAt: string;
}

export interface BatchEventDetails {
  batchId: string;
  drugName: string;
  manufacturer: string;
  manufactureDate: string;
  expiryDate: string;
  paymentHash?: string;
  eventId: string;
  createdAt: number;
}

export interface VerifyBatchResponse {
  status: VerificationStatus;
  details?: BatchEventDetails;
}
