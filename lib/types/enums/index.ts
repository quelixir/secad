export const EntityStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DISSOLVED: 'Dissolved',
} as const;

export const MemberType = {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY',
  OTHER_NON_INDIVIDUAL: 'OTHER_NON_INDIVIDUAL',
} as const;

export const MemberStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  RESIGNED: 'Resigned',
} as const;

export const AssociateType = {
  OFFICEHOLDER_DIRECTOR: 'officeholder_director',
  OFFICEHOLDER_SECRETARY: 'officeholder_secretary',
  TRUSTEE: 'trustee',
  APPOINTOR: 'appointor',
} as const;

export const AssociateStatus = {
  ACTIVE: 'Active',
  RESIGNED: 'Resigned',
  REMOVED: 'Removed',
} as const;

export enum ResolutionType {
  // Directors' resolutions
  APPOINTMENT_OF_DIRECTOR = 'appointment_of_director',
  RESIGNATION_OF_DIRECTOR = 'resignation_of_director',
  REMOVAL_OF_DIRECTOR = 'removal_of_director',
  APPOINTMENT_OF_COMPANY_SECRETARY = 'appointment_of_company_secretary',
  CHANGE_OF_REGISTERED_OFFICE = 'change_of_registered_office',
  ISSUE_OF_SHARES = 'issue_of_shares',
  TRANSFER_OF_SHARES = 'transfer_of_shares',
  DECLARATION_OF_DIVIDENDS = 'declaration_of_dividends',
  APPROVAL_OF_FINANCIAL_STATEMENTS = 'approval_of_financial_statements',
  LODGEMENT_OF_ANNUAL_REVIEW = 'lodgement_of_annual_review',
  CHANGE_OF_COMPANY_NAME = 'change_of_company_name',
  CHANGE_TO_COMPANY_CONSTITUTION = 'change_to_company_constitution',
  ADOPTION_OF_A_CONSTITUTION = 'adoption_of_a_constitution',
  OPENING_A_BANK_ACCOUNT = 'opening_a_bank_account',
  EXECUTION_OF_CONTRACTS = 'execution_of_contracts',
  SOLVENCY_RESOLUTION = 'solvency_resolution',
  LOANS_TO_DIRECTORS = 'loans_to_directors',
  DIRECTORS_INTERESTS_DISCLOSURE = 'directors_interests_disclosure',
  CALLING_A_GENERAL_MEETING = 'calling_a_general_meeting',
  DISTRIBUTION_OF_PROFITS = 'distribution_of_profits',
  APPOINTMENT_OF_AUDITOR = 'appointment_of_auditor',
  APPROVAL_OF_RELATED_PARTY_TRANSACTIONS = 'approval_of_related_party_transactions',
  RECORD_OF_RESOLUTIONS_WITHOUT_MEETING = 'record_of_resolutions_without_meeting',
  GENERAL_BUSINESS = 'general_business',

  // Members' resolutions
  MEMBERS_DIRECTOR_APPOINTMENT = 'members_director_appointment',
  MEMBERS_DIRECTOR_REMOVAL = 'members_director_removal',
  CONSTITUTIONAL_AMENDMENT = 'constitutional_amendment',
  SHARE_ISSUE = 'share_issue',
  CAPITAL_REDUCTION = 'capital_reduction',
  WINDING_UP = 'winding_up',
  MEMBERS_GENERAL = 'members_general',
}

export enum ResolutionStatus {
  DRAFT = 'Draft',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  SUPERSEDED = 'Superseded',
}

export enum ResolutionCategory {
  DIRECTORS = 'directors',
  MEMBERS = 'members',
}
