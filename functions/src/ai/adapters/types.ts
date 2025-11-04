export type VendorResult = {
  outputUrl?: string | null;
  error?: string | null;
};

export type VendorPayload = {
  input: string;
  options?: Record<string, any>;
  uid: string;
  requestId: string;
};
