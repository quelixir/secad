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

export interface Resolution {
  id: string;
  title: string;
  type: string;
  category: string;
  description?: string;
  content: string;
  status: string;
  resolutionDate?: string;
  effectiveDate?: string;
  referenceNumber?: string;
  approvedBy?: string;
  votingDetails?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  entity: {
    id: string;
    name: string;
  };
}
