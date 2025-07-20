import { Associate } from './Associate';
import { Member } from './Member';
import { SecurityClass } from './Security';
import { Transaction } from './Transaction';
import { EntityIdentifier } from './EntityIdentifier';

export interface Entity {
  id: string;
  name: string;
  entityTypeId: string;
  status: string;
  incorporationDate?: Date | null;
  incorporationCountry?: string | null;
  incorporationState?: string | null;
  identifiers?: Array<{
    id: string;
    type: string;
    value: string;
    country: string;
    isActive: boolean;
  }>;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members: number;
    securityClasses: number;
    transactions: number;
  };
}

export interface EntityWithRelations extends Entity {
  members?: Member[];
  securityClasses?: SecurityClass[];
  transactions?: Transaction[];
  associates?: Associate[];
  identifiers?: EntityIdentifier[];
  _count?: {
    members: number;
    securityClasses: number;
    transactions: number;
    associates: number;
  };
}

export interface EntityInput {
  name: string;
  entityTypeId: string;
  incorporationDate?: Date;
  incorporationCountry?: string;
  incorporationState?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
}
