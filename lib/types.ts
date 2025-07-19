import {
  Entity,
  Member,
  SecurityClass,
  Transaction,
  Associate,
} from './generated/prisma';

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Extended types with relations
export interface EntityWithRelations extends Entity {
  members?: Member[];
  securityClasses?: SecurityClass[];
  transactions?: Transaction[];
  associates?: Associate[];
  _count?: {
    members: number;
    securityClasses: number;
    transactions: number;
    associates: number;
  };
}

export interface MemberWithRelations extends Member {
  entity?: Entity;
  transactionsFrom?: (Transaction & {
    toMember?: Member;
    securityClass?: SecurityClass;
  })[];
  transactionsTo?: (Transaction & {
    fromMember?: Member;
    securityClass?: SecurityClass;
  })[];
}

export interface SecurityClassWithRelations extends SecurityClass {
  entity?: Entity;
  transactions?: Transaction[];
  _count?: {
    transactions: number;
  };
}

export interface TransactionWithRelations extends Transaction {
  entity?: Entity;
  fromMember?: Member;
  toMember?: Member;
}

export interface AssociateWithRelations extends Associate {
  entity?: Entity;
}

// Form input types
export interface EntityInput {
  name: string;
  abn?: string;
  acn?: string;
  entityType: string;
  incorporationDate?: Date;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface MemberInput {
  entityId: string;
  firstName?: string;
  lastName?: string;
  entityName?: string;
  memberType: string;
  designation?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  memberNumber?: string;
  tfn?: string;
  abn?: string;
}

export interface SecurityClassInput {
  entityId: string;
  name: string;
  symbol?: string;
  description?: string;
  votingRights?: boolean;
  dividendRights?: boolean;
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
  currency?: string;
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

export interface AssociateInput {
  entityId: string;
  type: string;
  isIndividual: boolean;
  givenNames?: string;
  familyName?: string;
  dateOfBirth?: Date;
  previousNames?: string[];
  entityName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  appointmentDate?: Date;
  resignationDate?: Date;
  notes?: string;
}

// Enums
export const EntityStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DISSOLVED: 'Dissolved',
} as const;

export const MemberType = {
  INDIVIDUAL: 'Individual',
  COMPANY: 'Company',
  OTHER_NON_INDIVIDUAL: 'Other Non-Individual',
} as const;

export const MemberStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  RESIGNED: 'Resigned',
} as const;

export const TransactionType = {
  ISSUE: 'ISSUE',
  TRANSFER: 'TRANSFER',
  CANCELLATION: 'CANCELLATION',
  REDEMPTION: 'REDEMPTION',
  RETURN_OF_CAPITAL: 'RETURN_OF_CAPITAL',
  CAPITAL_CALL: 'CAPITAL_CALL',
} as const;

export const TransactionStatus = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export const AssociateType = {
  OFFICEHOLDER_DIRECTOR: 'officeholder_director',
  OFFICEHOLDER_SECRETARY: 'officeholder_secretary',
  TRUSTEE: 'trustee',
  APPOINTOR: 'appointor',
} as const;

export const AssociateStatus = {
  ACTIVE: 'Active',
  RESIGNED: 'Resigned',
  REMOVED: 'Removed',
} as const;

export const EntityType = {
  PROPRIETARY: 'Proprietary Company',
  PUBLIC: 'Public Company',
  TRUST: 'Trust',
  PARTNERSHIP: 'Partnership',
  OTHER: 'Other',
} as const;

export const AustralianStates = {
  NSW: 'NSW',
  VIC: 'VIC',
  QLD: 'QLD',
  WA: 'WA',
  SA: 'SA',
  TAS: 'TAS',
  ACT: 'ACT',
  NT: 'NT',
} as const;

export interface ResolutionInput {
  entityId: string;
  title: string;
  type: string;
  category: string;
  description?: string;
  content: string;
  status?: string;
  resolutionDate?: Date;
  effectiveDate?: Date;
  approvedBy?: string;
  votingDetails?: string;
  referenceNumber?: string;
  attachments?: string[];
  relatedPersonId?: string;
  notes?: string;
  createdBy?: string;
}

// Resolution types enum - updated with standard directors' resolutions
export enum ResolutionType {
  // Directors' resolutions (from standard_directors_resolutions.csv)
  APPOINTMENT_OF_DIRECTOR = 'appointment_of_director',
  RESIGNATION_OF_DIRECTOR = 'resignation_of_director',
  REMOVAL_OF_DIRECTOR = 'removal_of_director',
  APPOINTMENT_OF_COMPANY_SECRETARY = 'appointment_of_company_secretary',
  CHANGE_OF_REGISTERED_OFFICE = 'change_of_registered_office',
  ISSUE_OF_SHARES = 'issue_of_shares',
  TRANSFER_OF_SHARES = 'transfer_of_shares',
  DECLARATION_OF_DIVIDENDS = 'declaration_of_dividends',
  APPROVAL_OF_FINANCIAL_STATEMENTS = 'approval_of_financial_statements',
  LODGEMENT_OF_ANNUAL_REVIEW = 'lodgement_of_annual_review',
  CHANGE_OF_COMPANY_NAME = 'change_of_company_name',
  CHANGE_TO_COMPANY_CONSTITUTION = 'change_to_company_constitution',
  ADOPTION_OF_A_CONSTITUTION = 'adoption_of_a_constitution',
  OPENING_A_BANK_ACCOUNT = 'opening_a_bank_account',
  EXECUTION_OF_CONTRACTS = 'execution_of_contracts',
  SOLVENCY_RESOLUTION = 'solvency_resolution',
  LOANS_TO_DIRECTORS = 'loans_to_directors',
  DIRECTORS_INTERESTS_DISCLOSURE = 'directors_interests_disclosure',
  CALLING_A_GENERAL_MEETING = 'calling_a_general_meeting',
  DISTRIBUTION_OF_PROFITS = 'distribution_of_profits',
  APPOINTMENT_OF_AUDITOR = 'appointment_of_auditor',
  APPROVAL_OF_RELATED_PARTY_TRANSACTIONS = 'approval_of_related_party_transactions',
  RECORD_OF_RESOLUTIONS_WITHOUT_MEETING = 'record_of_resolutions_without_meeting',
  GENERAL_BUSINESS = 'general_business',

  // Members' resolutions
  MEMBERS_DIRECTOR_APPOINTMENT = 'members_director_appointment',
  MEMBERS_DIRECTOR_REMOVAL = 'members_director_removal',
  CONSTITUTIONAL_AMENDMENT = 'constitutional_amendment',
  SHARE_ISSUE = 'share_issue',
  CAPITAL_REDUCTION = 'capital_reduction',
  WINDING_UP = 'winding_up',
  MEMBERS_GENERAL = 'members_general',
}

// Resolution status enum
export enum ResolutionStatus {
  DRAFT = 'Draft',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  SUPERSEDED = 'Superseded',
}

// Resolution category enum
export enum ResolutionCategory {
  DIRECTORS = 'directors',
  MEMBERS = 'members',
}
