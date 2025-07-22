import { Entity } from './Entity';

export interface MemberContact {
  id: string;
  memberId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  id: string;
  entityId: string;
  firstName?: string | null;
  lastName?: string | null;
  entityName?: string | null;
  memberType: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country: string;
  memberNumber?: string | null;
  designation?: string | null;
  beneficiallyHeld: boolean;
  joinDate: Date;
  status: string;
  tfn?: string | null;
  abn?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  allocations?: Array<{ quantity: number }>;
  contacts?: MemberContact[];
}

export interface MemberWithRelations extends Member {
  entity?: Entity;
}

export interface MemberInput {
  entityId: string;
  firstName?: string;
  lastName?: string;
  entityName?: string;
  memberType: string;
  designation?: string;
  beneficiallyHeld?: boolean;
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
  contacts?: MemberContactInput[];
}

export interface MemberContactInput {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}
