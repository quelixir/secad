// Base entity type categories
export const EntityTypeCategory = {
  COMPANY: 'COMPANY',
  PARTNERSHIP: 'PARTNERSHIP',
  TRUST: 'TRUST',
  OTHER: 'OTHER',
} as const;

export type EntityTypeCategory =
  (typeof EntityTypeCategory)[keyof typeof EntityTypeCategory];

// Interface for compliance pack entity types
export interface EntityType {
  id: string;
  shortCode: string;
  name: string;
  category: EntityTypeCategory;
  description?: string;
}

// Default entity types for regions without a compliance pack
export const DefaultEntityTypes: EntityType[] = [
  {
    id: 'default_company',
    shortCode: 'COMPANY',
    name: 'Company',
    category: 'COMPANY',
  },
  {
    id: 'default_partnership',
    shortCode: 'PARTNERSHIP',
    name: 'Partnership',
    category: 'PARTNERSHIP',
  },
  {
    id: 'default_trust',
    shortCode: 'TRUST',
    name: 'Trust',
    category: 'TRUST',
  },
  {
    id: 'default_other',
    shortCode: 'OTHER',
    name: 'Other',
    category: 'OTHER',
  },
];
