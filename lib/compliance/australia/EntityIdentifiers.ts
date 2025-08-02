import { validateACN, formatACN } from "./EntityIdentifierACN";
import { validateABN, formatABN } from "./EntityIdentifierABN";
import type { IdentifierType } from "../types/IdentifierType";

export const australiaIdentifierTypes: IdentifierType[] = [
  {
    abbreviation: "ACN",
    name: "Australian Company Number",
    description:
      "A unique 9-digit identifier for companies registered with ASIC",
    formatPattern: "XXX XXX XXX",
    validate: validateACN,
    format: formatACN,
    placeholder: "123 456 789",
  },
  {
    abbreviation: "ABN",
    name: "Australian Business Number",
    description:
      "A unique 11-digit identifier for all entities registered in the Australian Business Register",
    formatPattern: "XX XXX XXX XXX",
    validate: validateABN,
    format: formatABN,
    placeholder: "12 345 678 901",
  },
];

export { formatACN, validateACN, formatABN, validateABN };
