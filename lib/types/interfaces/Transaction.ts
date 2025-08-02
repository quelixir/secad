import { Member } from "./Member";
import { Entity } from "./Entity";
import { SecurityClass } from "./Security";
import { Currency } from "@/lib/currencies";

export interface Transaction {
  id: string;
  entityId: string;
  securityClassId: string;
  transactionType: TransactionType;
  reasonCode: string;
  quantity: number;
  amountPaidPerSecurity?: number;
  amountUnpaidPerSecurity?: number;
  currencyCode?: string;
  fromMemberId?: string;
  toMemberId?: string;
  trancheNumber?: string;
  trancheSequence?: number;
  postedDate: Date;
  settlementDate: Date;
  reference?: string;
  description?: string;
  certificateNumber?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionWithRelations extends Transaction {
  entity?: Entity;
  currency?: Currency;
  securityClass?: SecurityClass;
  fromMember?: Member;
  toMember?: Member;
}

export interface TransactionInput {
  entityId: string;
  securityClassId: string;
  transactionType: TransactionType;
  reasonCode: string;
  quantity: number;
  amountPaidPerSecurity?: number;
  amountUnpaidPerSecurity?: number;
  currencyCode?: string;
  fromMemberId?: string;
  toMemberId?: string;
  trancheNumber?: string;
  trancheSequence?: number;
  postedDate?: Date;
  settlementDate?: Date;
  reference?: string;
  description?: string;
  certificateNumber?: string;
  status?: string;
}

export enum TransactionType {
  ISSUE = "ISSUE",
  TRANSFER = "TRANSFER",
  CANCELLATION = "CANCELLATION",
  REDEMPTION = "REDEMPTION",
  RETURN_OF_CAPITAL = "RETURN_OF_CAPITAL",
  CAPITAL_CALL = "CAPITAL_CALL",
}

export enum TransactionStatus {
  PENDING = "Pending",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
}

export enum TransactionDirection {
  IN = "IN",
  OUT = "OUT",
}
