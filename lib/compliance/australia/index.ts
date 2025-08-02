import { australiaEntityTypes } from "./EntityTypes";
import { australiaIdentifierTypes } from "./EntityIdentifiers";
import type { CompliancePack } from "../CompliancePack";

export const australiaCompliancePack: CompliancePack = {
  id: "australia",
  country: "Australia",
  name: "Australia Compliance Pack",
  entityTypes: australiaEntityTypes,
  identifierTypes: australiaIdentifierTypes,
};

export { australiaEntityTypes } from "./EntityTypes";
export { australiaIdentifierTypes } from "./EntityIdentifiers";
