export interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
  subscription?: Subscription;
  imageUrl?: string;
}

export enum Subscription {
  PREMIUM = 0, FREE = 1
}