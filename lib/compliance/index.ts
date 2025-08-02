import { australiaCompliancePack } from "./australia";
import { newZealandCompliancePack } from "./new_zealand";
import type { CompliancePack } from "./CompliancePack";
import type { IdentifierType } from "./types/IdentifierType";
import { EntityType } from "../types/interfaces/EntityType";
import { DefaultEntityTypes } from "../types/interfaces/EntityType";

// Registry of all compliance packs
const COMPLIANCE_PACKS: Record<string, CompliancePack> = {
  australia: australiaCompliancePack,
  new_zealand: newZealandCompliancePack,
} as const;

class CompliancePackRegistration {
  private packs: Map<string, CompliancePack>;
  private countryToPackMap: Map<string, CompliancePack>;

  constructor() {
    this.packs = new Map(Object.entries(COMPLIANCE_PACKS));

    // Dynamically create country to pack mapping from CompliancePack.country fields
    this.countryToPackMap = new Map();
    this.packs.forEach((pack) => {
      this.countryToPackMap.set(pack.country, pack);
    });
  }

  getByCountry(country: string): CompliancePack | undefined {
    return this.countryToPackMap.get(country);
  }

  getAllPacks(): CompliancePack[] {
    return Array.from(this.packs.values());
  }

  getIdentifierType(
    country: string,
    typeCode: string,
  ): IdentifierType | undefined {
    const pack = this.getByCountry(country);
    return pack?.identifierTypes.find((type) => type.abbreviation === typeCode);
  }

  validateIdentifier(
    country: string,
    typeCode: string,
    value: string,
  ): boolean {
    const identifierType = this.getIdentifierType(country, typeCode);
    return identifierType?.validate(value) ?? false;
  }

  formatIdentifier(country: string, typeCode: string, value: string): string {
    const identifierType = this.getIdentifierType(country, typeCode);
    return identifierType?.format(value) ?? value;
  }

  getEntityTypes(country: string): EntityType[] {
    const pack = this.getByCountry(country);
    return pack?.entityTypes ?? DefaultEntityTypes;
  }

  getEntityType(country: string, id: string): EntityType | undefined {
    const entityTypes = this.getEntityTypes(country);
    return entityTypes.find((type) => type.id === id);
  }

  getEntityTypeByShortCode(
    country: string,
    shortCode: string,
  ): EntityType | undefined {
    const entityTypes = this.getEntityTypes(country);
    return entityTypes.find((type) => type.shortCode === shortCode);
  }
}

// Export singleton instance
export const compliancePackRegistration = new CompliancePackRegistration();

// Export types
export type { CompliancePack } from "./CompliancePack";
export type { IdentifierType } from "./types/IdentifierType";
export type { EntityType } from "../types/interfaces/EntityType";
export { EntityTypeCategory } from "../types/interfaces/EntityType";
