export interface TurnstileVerificationData {
  token: string;
  action: string;
  uid?: string;
  email?: string;
}

export interface SubscriberData {
  email: string;
  name?: string;
}
