import { Entity } from './Entity';
import { TransactionWithRelations, TransactionType } from './Transaction';
import { SecurityClass } from './Security';

export interface MemberContact {
  id: string;
  memberId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JointMemberPerson {
  id: string;
  memberId: string;
  givenNames?: string | null;
  familyName?: string | null;
  entityName?: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  id: string;
  entityId: string;
  givenNames?: string | null;
  familyName?: string | null;
  entityName?: string | null;
  memberType: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country: string;
  memberNumber?: string | null;
  designation?: string | null;
  beneficiallyHeld: boolean;
  joinDate: Date;
  status: string;
  tfn?: string | null;
  abn?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  transactions?: Array<{ quantity: number }>;
  contacts?: MemberContact[];
  jointPersons?: JointMemberPerson[];
}

export function getFormattedMemberName(member: Member): string {
  if (member.entityName) return member.entityName;
  return `${member.givenNames || ''} ${member.familyName || ''}`.trim();
}

// Utility function to add getFormattedName method to any Member object
export function addFormattedNameMethod(
  member: Member
): Member & { getFormattedName(): string } {
  return {
    ...member,
    getFormattedName() {
      return getFormattedMemberName(member);
    },
  };
}

export interface MemberWithRelations extends Member {
  entity?: Entity;
}

export interface MemberHolding {
  securityClass: SecurityClass;
  balance: number;
}

export function calculateMemberHoldings(
  memberId: string,
  transactions: TransactionWithRelations[]
): MemberHolding[] {
  const holdings = new Map<
    string,
    { securityClass: SecurityClass; balance: number }
  >();

  transactions.forEach((transaction) => {
    if (!transaction.securityClass) return;

    const securityClassId = transaction.securityClassId;
    const currentHolding = holdings.get(securityClassId) || {
      securityClass: transaction.securityClass,
      balance: 0,
    };

    let quantityChange = 0;

    switch (transaction.transactionType) {
      case TransactionType.ISSUE:
        // Member receives shares (positive)
        if (transaction.toMemberId === memberId) {
          quantityChange = transaction.quantity;
        }
        break;

      case TransactionType.TRANSFER:
        // Member receives shares (positive)
        if (transaction.toMemberId === memberId) {
          quantityChange = transaction.quantity;
        }
        // Member gives up shares (negative)
        if (transaction.fromMemberId === memberId) {
          quantityChange -= transaction.quantity;
        }
        break;

      case TransactionType.REDEMPTION:
        // Member loses shares (negative)
        if (transaction.fromMemberId === memberId) {
          quantityChange = -transaction.quantity;
        }
        break;

      case TransactionType.CANCELLATION:
        // Member loses shares (negative)
        if (transaction.fromMemberId === memberId) {
          quantityChange = -transaction.quantity;
        }
        break;

      case TransactionType.RETURN_OF_CAPITAL:
        // Member loses shares (negative)
        if (transaction.fromMemberId === memberId) {
          quantityChange = -transaction.quantity;
        }
        break;

      case TransactionType.CAPITAL_CALL:
        // Member receives shares (positive) - typically for capital calls
        if (transaction.toMemberId === memberId) {
          quantityChange = transaction.quantity;
        }
        break;

      default:
        // Unknown transaction type - no change
        break;
    }

    currentHolding.balance += quantityChange;
    holdings.set(securityClassId, currentHolding);
  });

  // Return only holdings with positive balances
  return Array.from(holdings.values())
    .filter((holding) => holding.balance > 0)
    .sort((a, b) => a.securityClass.name.localeCompare(b.securityClass.name));
}

export interface MemberInput {
  entityId: string;
  givenNames?: string;
  familyName?: string;
  entityName?: string;
  memberType: string;
  designation?: string;
  beneficiallyHeld?: boolean;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  memberNumber?: string;
  tfn?: string;
  abn?: string;
  contacts?: MemberContactInput[];
  jointPersons?: JointMemberPersonInput[];
}

export interface MemberContactInput {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export interface JointMemberPersonInput {
  givenNames?: string;
  familyName?: string;
  entityName?: string;
  order?: number;
}
