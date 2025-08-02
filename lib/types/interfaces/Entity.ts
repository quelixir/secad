import { Associate } from "./Associate";
import { Member } from "./Member";
import { SecurityClass } from "./Security";
import { Transaction } from "./Transaction";
import { EntityIdentifier } from "./EntityIdentifier";

export enum EntityStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  DISSOLVED = "Dissolved",
}

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

// Interface for API response (dates come as strings from the API)
export interface EntityApiResponse
  extends Omit<
    EntityWithRelations,
    | "incorporationDate"
    | "createdAt"
    | "updatedAt"
    | "members"
    | "securityClasses"
  > {
  incorporationDate?: string | null;
  createdAt: string;
  updatedAt: string;
  members?: Array<
    Omit<Member, "joinDate" | "createdAt" | "updatedAt"> & {
      joinDate: string;
      createdAt: string;
      updatedAt: string;
    }
  >;
  securityClasses?: Array<
    Omit<SecurityClass, "createdAt" | "updatedAt"> & {
      createdAt: string;
      updatedAt: string;
      isActive: boolean;
      transactions?: Array<{
        id: string;
        totalAmountPaid: string | null;
        totalAmountUnpaid: string | null;
        quantity: number;
      }>;
    }
  >;
}
