import { newZealandEntityTypes } from "./EntityTypes";
import { newZealandIdentifierTypes } from "./EntityIdentifiers";
import type { CompliancePack } from "../CompliancePack";

export const newZealandCompliancePack: CompliancePack = {
  id: "new_zealand",
  country: "New Zealand",
  name: "New Zealand Compliance Pack",
  entityTypes: newZealandEntityTypes,
  identifierTypes: newZealandIdentifierTypes,
};

export { newZealandEntityTypes } from "./EntityTypes";
export { newZealandIdentifierTypes } from "./EntityIdentifiers";
