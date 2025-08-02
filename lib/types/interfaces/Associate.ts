import { Entity } from "./Entity";

export interface Associate {
  id: string;
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
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssociateWithRelations extends Associate {
  entity?: Entity;
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
