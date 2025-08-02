---
sidebar_position: 2
---

# Compliance Packs

Compliance packs provide jurisdiction-specific validation, formatting, and entity type definitions for secad. They enable the application to handle different regulatory requirements across multiple countries.

## What are Compliance Packs?

Compliance packs are modular, country-specific configurations containing:

- **Entity Types**: Legal entity types recognized in that jurisdiction
- **Identifier Types**: Government-issued business identifiers with validation rules
- **Validation Logic**: Country-specific validation algorithms
- **Formatting Rules**: How identifiers should be displayed

## Architecture

Compliance packs follow a modular structure:

```
lib/compliance/
├── index.ts                    # Main registration
├── CompliancePack.ts           # Core interfaces
├── types/
│   └── IdentifierType.ts       # Identifier definitions
├── country_a/                  # Country A compliance pack
│   ├── index.ts
│   ├── EntityTypes.ts
│   ├── EntityIdentifiers.ts
│   └── EntityIdentifierXXX.ts
└── country_b/                  # Country B compliance pack
    ├── index.ts
    ├── EntityTypes.ts
    ├── EntityIdentifiers.ts
    └── EntityIdentifierYYY.ts
```

## Loading and Access

Compliance packs are loaded through a singleton registration system:

```typescript
// Registration
const COMPLIANCE_PACKS: Record<string, CompliancePack> = {
  country_a: countryACompliancePack,
  country_b: countryBCompliancePack,
} as const;

class CompliancePackRegistration {
  private packs: Map<string, CompliancePack>;
  private countryToPackMap: Map<string, CompliancePack>;

  constructor() {
    this.packs = new Map(Object.entries(COMPLIANCE_PACKS));
    this.countryToPackMap = new Map();
    this.packs.forEach((pack) => {
      this.countryToPackMap.set(pack.country, pack);
    });
  }
}

export const compliancePackRegistration = new CompliancePackRegistration();
```

### Access Pattern

The compliance pack registration provides a unified interface for accessing jurisdiction-specific functionality:

```typescript
const pack = compliancePackRegistration.getByCountry('Country Name'); // Get compliance pack by country
const isValid = compliancePackRegistration.validateIdentifier('Country Name', 'IDENTIFIER_TYPE', 'identifier_value'); // Validate an identifier
const formatted = compliancePackRegistration.formatIdentifier('Country Name', 'IDENTIFIER_TYPE', 'identifier_value'); // Format an identifier
const entityTypes = compliancePackRegistration.getEntityTypes('Country Name'); // Get entity types for a country
```

## Components

### Entity Types

Define legal entity types for each jurisdiction:

```typescript
export interface EntityType {
  id: string;
  shortCode: string;
  name: string;
  category: EntityTypeCategory;
  description: string;
}
```

### Identifier Types

Define business identifiers with validation and formatting:

```typescript
export interface IdentifierType {
  abbreviation: string;
  name: string;
  description: string;
  formatPattern: string;
  validate: (value: string) => boolean;
  format: (value: string) => string;
  placeholder: string;
}
```

### Validation and Formatting

Each identifier includes validation algorithms and formatting rules:

```typescript
export function validateIdentifier(identifier: string): boolean {
  // Clean input, check length, apply validation rules
}

export function formatIdentifier(identifier: string): string {
  // Apply formatting pattern (e.g., "123456789" → "123 456 789")
}
```

## Available Compliance Packs

- **Australia** - `lib/compliance/australia/`
- **New Zealand** - `lib/compliance/new_zealand/`

## Extending Compliance Packs

To add a new country:

1. **Create directory structure:**
   ```
   lib/compliance/new_country/
   ├── index.ts
   ├── EntityTypes.ts
   ├── EntityIdentifiers.ts
   └── EntityIdentifierXXX.ts
   ```

2. **Define entity types:**
   ```typescript
   export const newCountryEntityTypes: EntityType[] = [
     {
       id: 'unique-id',
       shortCode: 'SHORT_CODE',
       name: 'Entity Type Name',
       category: 'COMPANY',
       description: 'Description'
     }
   ];
   ```

3. **Define identifier types:**
   ```typescript
   export const newCountryIdentifierTypes: IdentifierType[] = [
     {
       abbreviation: 'XXX',
       name: 'Identifier Name',
       description: 'Description',
       formatPattern: 'XXX XXX XXX',
       validate: validateXXX,
       format: formatXXX,
       placeholder: '123 456 789'
     }
   ];
   ```

4. **Implement validation and formatting:**
   ```typescript
   export function validateXXX(value: string): boolean {
     // Implement validation logic
   }
   
   export function formatXXX(value: string): string {
     // Implement formatting logic
   }
   ```

 