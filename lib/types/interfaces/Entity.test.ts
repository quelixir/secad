import {
  Entity,
  EntityWithRelations,
  EntityInput,
  EntityApiResponse,
  EntityStatus,
} from "./Entity";

describe("Entity Interface", () => {
  describe("EntityStatus enum", () => {
    it("should have all required status values", () => {
      expect(EntityStatus.ACTIVE).toBe("Active");
      expect(EntityStatus.INACTIVE).toBe("Inactive");
      expect(EntityStatus.DISSOLVED).toBe("Dissolved");
    });

    it("should have correct number of statuses", () => {
      expect(Object.keys(EntityStatus)).toHaveLength(3);
    });

    it("should have unique values", () => {
      const values = Object.values(EntityStatus);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe("Entity interface", () => {
    it("should allow creation of valid Entity object", () => {
      const entity: Entity = {
        id: "entity-123",
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        status: EntityStatus.ACTIVE,
        incorporationDate: new Date("2020-01-01"),
        incorporationCountry: "Australia",
        incorporationState: "NSW",
        address: "123 Business St",
        city: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
        email: "contact@acme.com",
        phone: "+61 2 1234 5678",
        website: "https://acme.com",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
        _count: {
          members: 5,
          securityClasses: 2,
          transactions: 10,
        },
      };

      expect(entity.id).toBe("entity-123");
      expect(entity.name).toBe("Acme Corporation Ltd");
      expect(entity.status).toBe(EntityStatus.ACTIVE);
      expect(entity._count?.members).toBe(5);
    });

    it("should allow optional fields to be undefined", () => {
      const entity: Entity = {
        id: "entity-123",
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        status: EntityStatus.ACTIVE,
        country: "Australia",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(entity.incorporationDate).toBeUndefined();
      expect(entity.address).toBeUndefined();
      expect(entity.email).toBeUndefined();
      expect(entity._count).toBeUndefined();
    });

    it("should allow null values for optional fields", () => {
      const entity: Entity = {
        id: "entity-123",
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        status: EntityStatus.ACTIVE,
        incorporationDate: null,
        incorporationCountry: null,
        incorporationState: null,
        address: null,
        city: null,
        state: null,
        postcode: null,
        country: "Australia",
        email: null,
        phone: null,
        website: null,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(entity.incorporationDate).toBeNull();
      expect(entity.email).toBeNull();
    });
  });

  describe("EntityWithRelations interface", () => {
    it("should extend Entity with optional relations", () => {
      const entityWithRelations: EntityWithRelations = {
        id: "entity-123",
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        status: EntityStatus.ACTIVE,
        country: "Australia",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
        members: [],
        securityClasses: [],
        transactions: [],
        associates: [],
        identifiers: [],
        _count: {
          members: 5,
          securityClasses: 2,
          transactions: 10,
          associates: 3,
        },
      };

      expect(entityWithRelations.members).toBeDefined();
      expect(entityWithRelations.securityClasses).toBeDefined();
      expect(entityWithRelations.transactions).toBeDefined();
      expect(entityWithRelations.associates).toBeDefined();
      expect(entityWithRelations.identifiers).toBeDefined();
    });
  });

  describe("EntityInput interface", () => {
    it("should allow creation of valid EntityInput object", () => {
      const entityInput: EntityInput = {
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        incorporationDate: new Date("2020-01-01"),
        incorporationCountry: "Australia",
        incorporationState: "NSW",
        address: "123 Business St",
        city: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
        email: "contact@acme.com",
        phone: "+61 2 1234 5678",
        website: "https://acme.com",
      };

      expect(entityInput.name).toBe("Acme Corporation Ltd");
      expect(entityInput.entityTypeId).toBe("company");
      expect(entityInput.country).toBe("Australia");
    });

    it("should allow optional fields to be undefined", () => {
      const entityInput: EntityInput = {
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        country: "Australia",
      };

      expect(entityInput.incorporationDate).toBeUndefined();
      expect(entityInput.address).toBeUndefined();
      expect(entityInput.email).toBeUndefined();
    });
  });

  describe("EntityApiResponse interface", () => {
    it("should have string dates instead of Date objects", () => {
      const entityApiResponse: EntityApiResponse = {
        id: "entity-123",
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        status: EntityStatus.ACTIVE,
        incorporationDate: "2020-01-01",
        incorporationCountry: "Australia",
        incorporationState: "NSW",
        address: "123 Business St",
        city: "Sydney",
        state: "NSW",
        postcode: "2000",
        country: "Australia",
        email: "contact@acme.com",
        phone: "+61 2 1234 5678",
        website: "https://acme.com",
        createdAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-01T00:00:00.000Z",
      };

      expect(typeof entityApiResponse.incorporationDate).toBe("string");
      expect(typeof entityApiResponse.createdAt).toBe("string");
      expect(typeof entityApiResponse.updatedAt).toBe("string");
    });

    it("should allow members with string dates", () => {
      const entityApiResponse: EntityApiResponse = {
        id: "entity-123",
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        status: EntityStatus.ACTIVE,
        country: "Australia",
        createdAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-01T00:00:00.000Z",
        members: [
          {
            id: "member-123",
            entityId: "entity-123",
            memberType: "INDIVIDUAL",
            country: "Australia",
            beneficiallyHeld: true,
            joinDate: "2020-01-01",
            status: "Active",
            createdAt: "2020-01-01T00:00:00.000Z",
            updatedAt: "2020-01-01T00:00:00.000Z",
          },
        ],
      };

      expect(entityApiResponse.members?.[0].joinDate).toBe("2020-01-01");
      expect(typeof entityApiResponse.members?.[0].createdAt).toBe("string");
      expect(typeof entityApiResponse.members?.[0].updatedAt).toBe("string");
    });
  });

  describe("Type validation", () => {
    it("should validate Entity object structure", () => {
      const entity: Entity = {
        id: "entity-123",
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        status: EntityStatus.ACTIVE,
        country: "Australia",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(typeof entity.id).toBe("string");
      expect(typeof entity.name).toBe("string");
      expect(typeof entity.entityTypeId).toBe("string");
      expect(typeof entity.status).toBe("string");
      expect(typeof entity.country).toBe("string");
      expect(entity.createdAt instanceof Date).toBe(true);
      expect(entity.updatedAt instanceof Date).toBe(true);
    });

    it("should validate EntityInput object structure", () => {
      const entityInput: EntityInput = {
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        country: "Australia",
      };

      expect(typeof entityInput.name).toBe("string");
      expect(typeof entityInput.entityTypeId).toBe("string");
      expect(typeof entityInput.country).toBe("string");
    });

    it("should validate EntityApiResponse object structure", () => {
      const entityApiResponse: EntityApiResponse = {
        id: "entity-123",
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        status: EntityStatus.ACTIVE,
        country: "Australia",
        createdAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-01T00:00:00.000Z",
      };

      expect(typeof entityApiResponse.id).toBe("string");
      expect(typeof entityApiResponse.name).toBe("string");
      expect(typeof entityApiResponse.entityTypeId).toBe("string");
      expect(typeof entityApiResponse.status).toBe("string");
      expect(typeof entityApiResponse.country).toBe("string");
      expect(typeof entityApiResponse.createdAt).toBe("string");
      expect(typeof entityApiResponse.updatedAt).toBe("string");
    });
  });

  describe("Interface compatibility", () => {
    it("should allow Entity to be assigned to EntityWithRelations", () => {
      const entity: Entity = {
        id: "entity-123",
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        status: EntityStatus.ACTIVE,
        country: "Australia",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      const entityWithRelations: EntityWithRelations = {
        ...entity,
        members: [],
        securityClasses: [],
        transactions: [],
        associates: [],
        identifiers: [],
        _count: {
          members: 5,
          securityClasses: 2,
          transactions: 10,
          associates: 3,
        },
      };

      expect(entityWithRelations.id).toBe(entity.id);
      expect(entityWithRelations.name).toBe(entity.name);
    });

    it("should allow EntityInput to be used for entity creation", () => {
      const entityInput: EntityInput = {
        name: "Acme Corporation Ltd",
        entityTypeId: "company",
        country: "Australia",
      };

      // Simulate entity creation
      const createdEntity: Entity = {
        id: "entity-123",
        name: entityInput.name,
        entityTypeId: entityInput.entityTypeId,
        status: EntityStatus.ACTIVE,
        country: entityInput.country || "Australia",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01"),
      };

      expect(createdEntity.name).toBe(entityInput.name);
      expect(createdEntity.entityTypeId).toBe(entityInput.entityTypeId);
      expect(createdEntity.country).toBe(entityInput.country);
    });
  });
});
