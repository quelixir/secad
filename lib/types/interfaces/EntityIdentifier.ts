export interface EntityIdentifier {
  id: string;
  type: string;
  value: string;
  country: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EntityIdentifierInput {
  type: string;
  value: string;
  country: string;
}
