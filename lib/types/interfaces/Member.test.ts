import {
  Member,
  MemberWithRelations,
  MemberInput,
  MemberContact,
  MemberContactInput,
  JointMemberPerson,
  JointMemberPersonInput,
  MemberHolding,
  MemberType,
  MemberStatus,
  getFormattedMemberName,
  addFormattedNameMethod,
  calculateMemberHoldings,
} from "./Member";
import { TransactionType } from "./Transaction";

describe("Member Interface", () => {
  describe("MemberType enum", () => {
    it("should have all required member types", () => {
      expect(MemberType.INDIVIDUAL).toBe("INDIVIDUAL");
      expect(MemberType.JOINT).toBe("JOINT");
      expect(MemberType.COMPANY).toBe("COMPANY");
      expect(MemberType.OTHER_NON_INDIVIDUAL).toBe("OTHER_NON_INDIVIDUAL");
    });

    it("should have correct number of types", () => {
      expect(Object.keys(MemberType)).toHaveLength(4);
    });

    it("should have unique values", () => {
      const values = Object.values(MemberType);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe("MemberStatus enum", () => {
    it("should have all required member statuses", () => {
      expect(MemberStatus.ACTIVE).toBe("Active");
      expect(MemberStatus.INACTIVE).toBe("Inactive");
      expect(MemberStatus.RESIGNED).toBe("Resigned");
    });

    it("should have correct number of statuses", () => {
      expect(Object.keys(MemberStatus)).toHaveLength(3);
    });

    it("should have unique values", () => {
      const values = Object.values(MemberStatus);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe("Member interface", () => {
    it("should allow creation of valid Member object", () => {
      const member: Member = {
        id: "ge5qwju028wfh08e8ssvbyul",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        givenNames: "John",
        familyName: "Doe",
        memberType: MemberType.INDIVIDUAL,
        email: "john.doe@example.com",
        phone: "+61 2 1234 5678",
        address: "123 Main St",
        city: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
        memberNumber: "MEM001",
        designation: "Director",
        beneficiallyHeld: true,
        joinDate: new Date("2020-01-01"),
        status: MemberStatus.ACTIVE,
        tfn: "123456789",
        abn: "12345678901",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
        createdBy: "uqyyk4cgkd26vmyca2kw8bhq",
        updatedBy: "uqyyk4cgkd26vmyca2kw8bhq",
        transactions: [{ quantity: 100 }],
        contacts: [],
        jointPersons: [],
      };

      expect(member.id).toBe("ge5qwju028wfh08e8ssvbyul");
      expect(member.givenNames).toBe("John");
      expect(member.familyName).toBe("Doe");
      expect(member.memberType).toBe(MemberType.INDIVIDUAL);
      expect(member.status).toBe(MemberStatus.ACTIVE);
    });

    it("should allow optional fields to be undefined", () => {
      const member: Member = {
        id: "ge5qwju028wfh08e8ssvbyul",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        memberType: MemberType.INDIVIDUAL,
        country: "Australia",
        beneficiallyHeld: true,
        joinDate: new Date("2020-01-01"),
        status: MemberStatus.ACTIVE,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(member.givenNames).toBeUndefined();
      expect(member.familyName).toBeUndefined();
      expect(member.email).toBeUndefined();
      expect(member.phone).toBeUndefined();
      expect(member.address).toBeUndefined();
      expect(member.city).toBeUndefined();
      expect(member.state).toBeUndefined();
      expect(member.postcode).toBeUndefined();
      expect(member.memberNumber).toBeUndefined();
      expect(member.designation).toBeUndefined();
      expect(member.tfn).toBeUndefined();
      expect(member.abn).toBeUndefined();
      expect(member.createdBy).toBeUndefined();
      expect(member.updatedBy).toBeUndefined();
      expect(member.transactions).toBeUndefined();
      expect(member.contacts).toBeUndefined();
      expect(member.jointPersons).toBeUndefined();
    });

    it("should allow null values for optional fields", () => {
      const member: Member = {
        id: "ge5qwju028wfh08e8ssvbyul",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        givenNames: null,
        familyName: null,
        entityName: null,
        memberType: MemberType.INDIVIDUAL,
        email: null,
        phone: null,
        address: null,
        city: null,
        state: null,
        postcode: null,
        country: "Australia",
        memberNumber: null,
        designation: null,
        beneficiallyHeld: true,
        joinDate: new Date("2020-01-01"),
        status: MemberStatus.ACTIVE,
        tfn: null,
        abn: null,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
        createdBy: null,
        updatedBy: null,
      };

      expect(member.givenNames).toBeNull();
      expect(member.familyName).toBeNull();
      expect(member.email).toBeNull();
      expect(member.phone).toBeNull();
      expect(member.address).toBeNull();
      expect(member.city).toBeNull();
      expect(member.state).toBeNull();
      expect(member.postcode).toBeNull();
      expect(member.memberNumber).toBeNull();
      expect(member.designation).toBeNull();
      expect(member.tfn).toBeNull();
      expect(member.abn).toBeNull();
      expect(member.createdBy).toBeNull();
      expect(member.updatedBy).toBeNull();
    });
  });

  describe("MemberContact interface", () => {
    it("should allow creation of valid MemberContact object", () => {
      const contact: MemberContact = {
        id: "contact-123",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+61 2 1234 5678",
        role: "Secretary",
        isPrimary: true,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(contact.id).toBe("contact-123");
      expect(contact.memberId).toBe("ge5qwju028wfh08e8ssvbyul");
      expect(contact.name).toBe("Jane Smith");
      expect(contact.isPrimary).toBe(true);
    });

    it("should allow optional fields to be undefined", () => {
      const contact: MemberContact = {
        id: "contact-123",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        name: "Jane Smith",
        isPrimary: true,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(contact.email).toBeUndefined();
      expect(contact.phone).toBeUndefined();
      expect(contact.role).toBeUndefined();
    });

    it("should allow null values for optional fields", () => {
      const contact: MemberContact = {
        id: "contact-123",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        name: "Jane Smith",
        email: null,
        phone: null,
        role: null,
        isPrimary: true,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(contact.email).toBeNull();
      expect(contact.phone).toBeNull();
      expect(contact.role).toBeNull();
    });
  });

  describe("JointMemberPerson interface", () => {
    it("should allow creation of valid JointMemberPerson object", () => {
      const jointPerson: JointMemberPerson = {
        id: "joint-person-123",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        givenNames: "John",
        familyName: "Doe",
        entityName: null,
        order: 1,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(jointPerson.id).toBe("joint-person-123");
      expect(jointPerson.memberId).toBe("ge5qwju028wfh08e8ssvbyul");
      expect(jointPerson.givenNames).toBe("John");
      expect(jointPerson.familyName).toBe("Doe");
      expect(jointPerson.order).toBe(1);
    });

    it("should allow optional fields to be undefined", () => {
      const jointPerson: JointMemberPerson = {
        id: "joint-person-123",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        order: 1,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(jointPerson.givenNames).toBeUndefined();
      expect(jointPerson.familyName).toBeUndefined();
      expect(jointPerson.entityName).toBeUndefined();
    });

    it("should allow null values for optional fields", () => {
      const jointPerson: JointMemberPerson = {
        id: "joint-person-123",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        givenNames: null,
        familyName: null,
        entityName: null,
        order: 1,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(jointPerson.givenNames).toBeNull();
      expect(jointPerson.familyName).toBeNull();
      expect(jointPerson.entityName).toBeNull();
    });
  });

  describe("MemberInput interface", () => {
    it("should allow creation of valid MemberInput object", () => {
      const memberInput: MemberInput = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        givenNames: "John",
        familyName: "Doe",
        memberType: MemberType.INDIVIDUAL,
        designation: "Director",
        beneficiallyHeld: true,
        email: "john.doe@example.com",
        phone: "+61 2 1234 5678",
        address: "123 Main St",
        city: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
        memberNumber: "MEM001",
        tfn: "123456789",
        abn: "12345678901",
        contacts: [],
        jointPersons: [],
      };

      expect(memberInput.entityId).toBe("d5vaqv2ed5pb3gulopy9z5ao");
      expect(memberInput.givenNames).toBe("John");
      expect(memberInput.familyName).toBe("Doe");
      expect(memberInput.memberType).toBe(MemberType.INDIVIDUAL);
    });

    it("should allow optional fields to be undefined", () => {
      const memberInput: MemberInput = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        memberType: MemberType.INDIVIDUAL,
        beneficiallyHeld: true,
        country: "Australia",
      };

      expect(memberInput.givenNames).toBeUndefined();
      expect(memberInput.familyName).toBeUndefined();
      expect(memberInput.designation).toBeUndefined();
      expect(memberInput.email).toBeUndefined();
      expect(memberInput.phone).toBeUndefined();
      expect(memberInput.address).toBeUndefined();
      expect(memberInput.city).toBeUndefined();
      expect(memberInput.state).toBeUndefined();
      expect(memberInput.postcode).toBeUndefined();
      expect(memberInput.memberNumber).toBeUndefined();
      expect(memberInput.tfn).toBeUndefined();
      expect(memberInput.abn).toBeUndefined();
      expect(memberInput.contacts).toBeUndefined();
      expect(memberInput.jointPersons).toBeUndefined();
    });
  });

  describe("MemberContactInput interface", () => {
    it("should allow creation of valid MemberContactInput object", () => {
      const contactInput: MemberContactInput = {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        phone: "+61 2 1234 5678",
        role: "Secretary",
        isPrimary: true,
      };

      expect(contactInput.name).toBe("Jane Smith");
      expect(contactInput.email).toBe("jane.smith@example.com");
      expect(contactInput.isPrimary).toBe(true);
    });

    it("should allow optional fields to be undefined", () => {
      const contactInput: MemberContactInput = {
        name: "Jane Smith",
      };

      expect(contactInput.email).toBeUndefined();
      expect(contactInput.phone).toBeUndefined();
      expect(contactInput.role).toBeUndefined();
      expect(contactInput.isPrimary).toBeUndefined();
    });
  });

  describe("JointMemberPersonInput interface", () => {
    it("should allow creation of valid JointMemberPersonInput object", () => {
      const jointPersonInput: JointMemberPersonInput = {
        givenNames: "John",
        familyName: "Doe",
        entityName: undefined,
        order: 1,
      };

      expect(jointPersonInput.givenNames).toBe("John");
      expect(jointPersonInput.familyName).toBe("Doe");
      expect(jointPersonInput.order).toBe(1);
    });

    it("should allow optional fields to be undefined", () => {
      const jointPersonInput: JointMemberPersonInput = {
        order: 1,
      };

      expect(jointPersonInput.givenNames).toBeUndefined();
      expect(jointPersonInput.familyName).toBeUndefined();
      expect(jointPersonInput.entityName).toBeUndefined();
    });
  });

  describe("MemberWithRelations interface", () => {
    it("should extend Member with optional entity relation", () => {
      const memberWithRelations: MemberWithRelations = {
        id: "ge5qwju028wfh08e8ssvbyul",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        memberType: MemberType.INDIVIDUAL,
        country: "Australia",
        beneficiallyHeld: true,
        joinDate: new Date("2020-01-01"),
        status: MemberStatus.ACTIVE,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
        entity: {
          id: "d5vaqv2ed5pb3gulopy9z5ao",
          name: "Acme Corporation Ltd",
          entityTypeId: "company",
          status: "Active",
          country: "Australia",
          createdAt: new Date("2020-01-01"),
          updatedAt: new Date("2020-01-01"),
        },
      };

      expect(memberWithRelations.entity).toBeDefined();
      expect(memberWithRelations.entity?.name).toBe("Acme Corporation Ltd");
    });
  });

  describe("MemberHolding interface", () => {
    it("should allow creation of valid MemberHolding object", () => {
      const holding: MemberHolding = {
        securityClass: {
          id: "security-class-123",
          name: "Ordinary Shares",
          symbol: "ORD",
          entityId: "d5vaqv2ed5pb3gulopy9z5ao",
          votingRights: true,
          dividendRights: true,
          isActive: true,
          isArchived: false,
          createdAt: new Date("2020-01-01"),
          updatedAt: new Date("2020-01-01"),
        },
        balance: 1000,
      };

      expect(holding.securityClass.name).toBe("Ordinary Shares");
      expect(holding.balance).toBe(1000);
    });
  });

  describe("Utility functions", () => {
    describe("getFormattedMemberName", () => {
      it("should return entity name when available", () => {
        const member: Member = {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityId: "d5vaqv2ed5pb3gulopy9z5ao",
          entityName: "Acme Corporation Ltd",
          memberType: MemberType.COMPANY,
          country: "Australia",
          beneficiallyHeld: true,
          joinDate: new Date("2020-01-01"),
          status: MemberStatus.ACTIVE,
          createdAt: new Date("2020-01-01"),
          updatedAt: new Date("2020-01-01"),
        };

        const formattedName = getFormattedMemberName(member);
        expect(formattedName).toBe("Acme Corporation Ltd");
      });

      it("should return concatenated names when entity name is not available", () => {
        const member: Member = {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityId: "d5vaqv2ed5pb3gulopy9z5ao",
          givenNames: "John",
          familyName: "Doe",
          memberType: MemberType.INDIVIDUAL,
          country: "Australia",
          beneficiallyHeld: true,
          joinDate: new Date("2020-01-01"),
          status: MemberStatus.ACTIVE,
          createdAt: new Date("2020-01-01"),
          updatedAt: new Date("2020-01-01"),
        };

        const formattedName = getFormattedMemberName(member);
        expect(formattedName).toBe("John Doe");
      });

      it("should handle missing names gracefully", () => {
        const member: Member = {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityId: "d5vaqv2ed5pb3gulopy9z5ao",
          memberType: MemberType.INDIVIDUAL,
          country: "Australia",
          beneficiallyHeld: true,
          joinDate: new Date("2020-01-01"),
          status: MemberStatus.ACTIVE,
          createdAt: new Date("2020-01-01"),
          updatedAt: new Date("2020-01-01"),
        };

        const formattedName = getFormattedMemberName(member);
        expect(formattedName).toBe("");
      });

      it("should handle partial names", () => {
        const member: Member = {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityId: "d5vaqv2ed5pb3gulopy9z5ao",
          givenNames: "John",
          memberType: MemberType.INDIVIDUAL,
          country: "Australia",
          beneficiallyHeld: true,
          joinDate: new Date("2020-01-01"),
          status: MemberStatus.ACTIVE,
          createdAt: new Date("2020-01-01"),
          updatedAt: new Date("2020-01-01"),
        };

        const formattedName = getFormattedMemberName(member);
        expect(formattedName).toBe("John");
      });
    });

    describe("addFormattedNameMethod", () => {
      it("should add getFormattedName method to member object", () => {
        const member: Member = {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityId: "d5vaqv2ed5pb3gulopy9z5ao",
          givenNames: "John",
          familyName: "Doe",
          memberType: MemberType.INDIVIDUAL,
          country: "Australia",
          beneficiallyHeld: true,
          joinDate: new Date("2020-01-01"),
          status: MemberStatus.ACTIVE,
          createdAt: new Date("2020-01-01"),
          updatedAt: new Date("2020-01-01"),
        };

        const memberWithMethod = addFormattedNameMethod(member);
        expect(typeof memberWithMethod.getFormattedName).toBe("function");
        expect(memberWithMethod.getFormattedName()).toBe("John Doe");
      });
    });

    describe("calculateMemberHoldings", () => {
      it("should calculate holdings from transactions", () => {
        const memberId = "ge5qwju028wfh08e8ssvbyul";
        const transactions = [
          {
            id: "txn-1",
            entityId: "d5vaqv2ed5pb3gulopy9z5ao",
            securityClassId: "security-class-1",
            quantity: 100,
            transactionType: TransactionType.ISSUE,
            reasonCode: "ISSUE",
            postedDate: new Date("2020-01-01"),
            settlementDate: new Date("2020-01-01"),
            status: "Completed",
            toMemberId: "ge5qwju028wfh08e8ssvbyul",
            createdAt: new Date("2020-01-01"),
            updatedAt: new Date("2020-01-01"),
            securityClass: {
              id: "security-class-1",
              name: "Ordinary Shares",
              symbol: "ORD",
              entityId: "d5vaqv2ed5pb3gulopy9z5ao",
              votingRights: true,
              dividendRights: true,
              isActive: true,
              isArchived: false,
              createdAt: new Date("2020-01-01"),
              updatedAt: new Date("2020-01-01"),
            },
          },
          {
            id: "txn-2",
            entityId: "d5vaqv2ed5pb3gulopy9z5ao",
            securityClassId: "security-class-1",
            quantity: 50,
            transactionType: TransactionType.ISSUE,
            reasonCode: "ISSUE",
            postedDate: new Date("2020-02-01"),
            settlementDate: new Date("2020-02-01"),
            status: "Completed",
            toMemberId: "ge5qwju028wfh08e8ssvbyul",
            createdAt: new Date("2020-02-01"),
            updatedAt: new Date("2020-02-01"),
            securityClass: {
              id: "security-class-1",
              name: "Ordinary Shares",
              symbol: "ORD",
              entityId: "d5vaqv2ed5pb3gulopy9z5ao",
              votingRights: true,
              dividendRights: true,
              isActive: true,
              isArchived: false,
              createdAt: new Date("2020-01-01"),
              updatedAt: new Date("2020-01-01"),
            },
          },
        ];

        const holdings = calculateMemberHoldings(memberId, transactions);
        expect(holdings).toHaveLength(1);
        expect(holdings[0].balance).toBe(150);
      });

      it("should handle empty transactions", () => {
        const memberId = "ge5qwju028wfh08e8ssvbyul";
        const transactions: any[] = [];

        const holdings = calculateMemberHoldings(memberId, transactions);
        expect(holdings).toHaveLength(0);
      });
    });
  });

  describe("Type validation", () => {
    it("should validate Member object structure", () => {
      const member: Member = {
        id: "ge5qwju028wfh08e8ssvbyul",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        memberType: MemberType.INDIVIDUAL,
        country: "Australia",
        beneficiallyHeld: true,
        joinDate: new Date("2020-01-01"),
        status: MemberStatus.ACTIVE,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(typeof member.id).toBe("string");
      expect(typeof member.entityId).toBe("string");
      expect(typeof member.memberType).toBe("string");
      expect(typeof member.country).toBe("string");
      expect(typeof member.beneficiallyHeld).toBe("boolean");
      expect(member.joinDate instanceof Date).toBe(true);
      expect(typeof member.status).toBe("string");
      expect(member.createdAt instanceof Date).toBe(true);
      expect(member.updatedAt instanceof Date).toBe(true);
    });

    it("should validate MemberInput object structure", () => {
      const memberInput: MemberInput = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        memberType: MemberType.INDIVIDUAL,
        beneficiallyHeld: true,
        country: "Australia",
      };

      expect(typeof memberInput.entityId).toBe("string");
      expect(typeof memberInput.memberType).toBe("string");
      expect(typeof memberInput.beneficiallyHeld).toBe("boolean");
      expect(typeof memberInput.country).toBe("string");
    });

    it("should validate MemberContact object structure", () => {
      const contact: MemberContact = {
        id: "contact-123",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        name: "Jane Smith",
        isPrimary: true,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(typeof contact.id).toBe("string");
      expect(typeof contact.memberId).toBe("string");
      expect(typeof contact.name).toBe("string");
      expect(typeof contact.isPrimary).toBe("boolean");
      expect(contact.createdAt instanceof Date).toBe(true);
      expect(contact.updatedAt instanceof Date).toBe(true);
    });

    it("should validate JointMemberPerson object structure", () => {
      const jointPerson: JointMemberPerson = {
        id: "joint-person-123",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        order: 1,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(typeof jointPerson.id).toBe("string");
      expect(typeof jointPerson.memberId).toBe("string");
      expect(typeof jointPerson.order).toBe("number");
      expect(jointPerson.createdAt instanceof Date).toBe(true);
      expect(jointPerson.updatedAt instanceof Date).toBe(true);
    });
  });
});
