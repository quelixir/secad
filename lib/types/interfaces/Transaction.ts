import { Member } from './Member';
import { Entity } from './Entity';
import { SecurityClass } from './Security';
import { Currency } from '@/lib/currencies';

export interface Transaction {
  id: string;
  entityId: string;
  securityClassId: string;
  transactionType: string;
  reasonCode: string;
  quantity: number;
  amountPaidPerSecurity?: number;
  amountUnpaidPerSecurity?: number;
  transferPricePerSecurity?: number;
  currencyCode?: string;
  fromMemberId?: string;
  toMemberId?: string;
  trancheNumber?: string;
  trancheSequence?: number;
  transactionDate: Date;
  settlementDate?: Date;
  reference?: string;
  description?: string;
  certificateNumber?: string;
  documentPath?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionWithRelations extends Transaction {
  entity?: Entity;
  currency?: Currency;
  security?: SecurityClass;
  fromMember?: Member;
  toMember?: Member;
}

export interface TransactionInput {
  entityId: string;
  securityClassId: string;
  transactionType: string;
  reasonCode: string;
  quantity: number;
  amountPaidPerSecurity?: number;
  amountUnpaidPerSecurity?: number;
  transferPricePerSecurity?: number;
  currencyCode?: string;
  fromMemberId?: string;
  toMemberId?: string;
  trancheNumber?: string;
  trancheSequence?: number;
  transactionDate?: Date;
  settlementDate?: Date;
  reference?: string;
  description?: string;
  certificateNumber?: string;
  documentPath?: string;
  status?: string;
}
