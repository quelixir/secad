import { Entity } from './Entity';
import { Transaction } from './Transaction';

export interface SecurityClass {
  id: string;
  entityId: string;
  name: string;
  symbol?: string;
  description?: string;
  votingRights: boolean;
  dividendRights: boolean;
  isActive: boolean;
  isArchived: boolean;
  customRights?: any;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface SecurityClassWithRelations extends SecurityClass {
  entity?: Entity;
  transactions?: Transaction[];
  _count?: {
    transactions: number;
  };
}

export interface SecurityClassInput {
  entityId: string;
  name: string;
  symbol?: string;
  description?: string;
  votingRights?: boolean;
  dividendRights?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  customRights?: any;
}
