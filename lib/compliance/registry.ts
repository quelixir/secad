import { CompliancePack } from "./CompliancePack";
import { australiaCompliancePack } from "./australia";
import { newZealandCompliancePack } from "./new_zealand";

// Registry of all available compliance packs
const COMPLIANCE_PACKS: Record<string, CompliancePack> = {
  australia: australiaCompliancePack,
  new_zealand: newZealandCompliancePack,
} as const;

export { COMPLIANCE_PACKS };
