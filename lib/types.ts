import { Entity, Member, SecurityClass, Holding, Transaction, Associate } from './generated/prisma'

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Extended types with relations
export interface EntityWithRelations extends Entity {
  members?: Member[]
  securityClasses?: SecurityClass[]
  transactions?: Transaction[]
  associates?: Associate[]
  _count?: {
    members: number
    securityClasses: number
    transactions: number
    associates: number
  }
}

export interface MemberWithRelations extends Member {
  entity?: Entity
  holdings?: (Holding & { securityClass: SecurityClass })[]
  transactionsFrom?: Transaction[]
  transactionsTo?: Transaction[]
}

export interface SecurityClassWithRelations extends SecurityClass {
  entity?: Entity
  holdings?: Holding[]
  transactions?: Transaction[]
  _count?: {
    holdings: number
    transactions: number
  }
}

export interface HoldingWithRelations extends Holding {
  member?: Member
  securityClass?: SecurityClass
}

export interface TransactionWithRelations extends Transaction {
  entity?: Entity
  securityClass?: SecurityClass
  fromMember?: Member
  toMember?: Member
}

export interface AssociateWithRelations extends Associate {
  entity?: Entity
}

// Form input types
export interface EntityInput {
  name: string
  abn?: string
  acn?: string
  entityType: string
  incorporationDate?: Date
  address?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
  email?: string
  phone?: string
  website?: string
}

export interface MemberInput {
  entityId: string
  firstName?: string
  lastName?: string
  entityName?: string
  memberType: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
  memberNumber?: string
  tfn?: string
  abn?: string
}

export interface SecurityClassInput {
  entityId: string
  name: string
  symbol?: string
  description?: string
  votingRights?: boolean
  dividendRights?: boolean
  parValue?: number
  currency?: string
}

export interface TransactionInput {
  entityId: string
  securityClassId: string
  type: string
  quantity: number
  pricePerSecurity?: number
  totalAmount?: number
  fromMemberId?: string
  toMemberId?: string
  transactionDate?: Date
  reference?: string
  description?: string
}

export interface AssociateInput {
  entityId: string
  type: string
  isIndividual: boolean
  givenNames?: string
  familyName?: string
  dateOfBirth?: Date
  previousNames?: string[]
  entityName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
  appointmentDate?: Date
  notes?: string
}

// Enums
export const EntityStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DISSOLVED: 'Dissolved'
} as const

export const MemberType = {
  INDIVIDUAL: 'Individual',
  COMPANY: 'Company',
  TRUST: 'Trust',
  SMSF: 'SMSF'
} as const

export const MemberStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  RESIGNED: 'Resigned'
} as const

export const TransactionType = {
  ISSUE: 'ISSUE',
  TRANSFER: 'TRANSFER',
  REDEMPTION: 'REDEMPTION',
  SPLIT: 'SPLIT',
  CONSOLIDATION: 'CONSOLIDATION'
} as const

export const TransactionStatus = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
} as const

export const AssociateType = {
  OFFICEHOLDER_DIRECTOR: 'officeholder_director',
  OFFICEHOLDER_SECRETARY: 'officeholder_secretary',
  TRUSTEE: 'trustee',
  APPOINTOR: 'appointor'
} as const

export const AssociateStatus = {
  ACTIVE: 'Active',
  RESIGNED: 'Resigned',
  REMOVED: 'Removed'
} as const

export const EntityType = {
  PROPRIETARY: 'PROPRIETARY',
  PUBLIC: 'PUBLIC',
  TRUST: 'TRUST',
  PARTNERSHIP: 'PARTNERSHIP',
  SOLE_TRADER: 'SOLE TRADER'
} as const

export const AustralianStates = {
  NSW: 'NSW',
  VIC: 'VIC',
  QLD: 'QLD',
  WA: 'WA',
  SA: 'SA',
  TAS: 'TAS',
  ACT: 'ACT',
  NT: 'NT'
} as const 

export interface ResolutionInput {
  entityId: string
  title: string
  type: string
  category: string
  description?: string
  content: string
  status?: string
  resolutionDate?: Date
  effectiveDate?: Date
  approvedBy?: string
  votingDetails?: string
  referenceNumber?: string
  attachments?: string[]
  relatedPersonId?: string
  notes?: string
  createdBy?: string
}

// Resolution types enum
export enum ResolutionType {
  // Directors' resolutions
  DIRECTORS_APPOINTMENT = 'directors_appointment',
  DIRECTORS_REMOVAL = 'directors_removal',
  DIRECTORS_RESIGNATION_ACCEPTANCE = 'directors_resignation_acceptance',
  DIVIDEND_DECLARATION = 'dividend_declaration',
  FINANCIAL_APPROVAL = 'financial_approval',
  POLICY_APPROVAL = 'policy_approval',
  CONTRACT_APPROVAL = 'contract_approval',
  GENERAL_BUSINESS = 'general_business',
  
  // Members' resolutions
  MEMBERS_DIRECTOR_APPOINTMENT = 'members_director_appointment',
  MEMBERS_DIRECTOR_REMOVAL = 'members_director_removal',
  CONSTITUTIONAL_AMENDMENT = 'constitutional_amendment',
  SHARE_ISSUE = 'share_issue',
  CAPITAL_REDUCTION = 'capital_reduction',
  WINDING_UP = 'winding_up',
  MEMBERS_GENERAL = 'members_general'
}

// Resolution status enum
export enum ResolutionStatus {
  DRAFT = 'Draft',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  SUPERSEDED = 'Superseded'
}

// Resolution category enum
export enum ResolutionCategory {
  DIRECTORS = 'directors',
  MEMBERS = 'members'
} 