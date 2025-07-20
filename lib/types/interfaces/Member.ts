import { Entity } from './Entity';

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
  joinDate: Date;
  status: string;
  tfn?: string | null;
  abn?: string | null;
  createdAt: Date;
  updatedAt: Date;
  allocations?: Array<{ quantity: number }>;
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
