import type { IdentifierType } from './types/IdentifierType';
import type { EntityType } from '../types/interfaces/EntityType';

export interface CompliancePack {
  id: string;
  country: string;
  name: string;
  identifierTypes: IdentifierType[];
  entityTypes: EntityType[];
}

export interface CompliancePackConfig {
  id: string;
  name: string;
  country: string;
  enabled: boolean;
  entityTypesPath: string;
}
