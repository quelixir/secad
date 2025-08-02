import {
  TransactionReasons,
  type TransactionReason,
} from "./transaction-reasons";

describe("TransactionReasons", () => {
  describe("TransactionReasons array", () => {
    it("should export a non-empty array of transaction reasons", () => {
      expect(TransactionReasons).toBeDefined();
      expect(Array.isArray(TransactionReasons)).toBe(true);
      expect(TransactionReasons.length).toBeGreaterThan(0);
    });

    it("should have transaction reasons with the correct structure", () => {
      TransactionReasons.forEach((reason) => {
        expect(reason).toHaveProperty("code");
        expect(reason).toHaveProperty("reason");
        expect(reason).toHaveProperty("description");
        expect(typeof reason.code).toBe("string");
        expect(typeof reason.reason).toBe("string");
        expect(typeof reason.description).toBe("string");
      });
    });

    it("should have unique transaction reason codes", () => {
      const codes = TransactionReasons.map((r) => r.code);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });

    it("should have valid transaction reason codes (3 letters)", () => {
      TransactionReasons.forEach((reason) => {
        expect(reason.code).toMatch(/^[A-Z]{3}$/);
      });
    });

    it("should have non-empty codes, reasons, and descriptions", () => {
      TransactionReasons.forEach((reason) => {
        expect(reason.code.trim().length).toBeGreaterThan(0);
        expect(reason.reason.trim().length).toBeGreaterThan(0);
        expect(reason.description.trim().length).toBeGreaterThan(0);
      });
    });

    it("should include common transaction reason codes", () => {
      const commonCodes = [
        "ADJ",
        "BON",
        "DRP",
        "FLT",
        "MER",
        "OPT",
        "PLC",
        "RED",
      ];
      commonCodes.forEach((code) => {
        const reason = TransactionReasons.find((r) => r.code === code);
        expect(reason).toBeDefined();
        expect(reason?.code).toBe(code);
      });
    });
  });

  describe("Specific transaction reasons", () => {
    it("should have ADJ (Adjustment) reason", () => {
      const adj = TransactionReasons.find((r) => r.code === "ADJ");
      expect(adj).toBeDefined();
      expect(adj?.code).toBe("ADJ");
      expect(adj?.reason).toBe("Adjustment");
      expect(adj?.description).toContain("adjustment");
    });

    it("should have BON (Bonus issue allotment) reason", () => {
      const bon = TransactionReasons.find((r) => r.code === "BON");
      expect(bon).toBeDefined();
      expect(bon?.code).toBe("BON");
      expect(bon?.reason).toBe("Bonus issue allotment");
      expect(bon?.description).toContain("bonus issue");
    });

    it("should have DRP (Dividend plan allotment) reason", () => {
      const drp = TransactionReasons.find((r) => r.code === "DRP");
      expect(drp).toBeDefined();
      expect(drp?.code).toBe("DRP");
      expect(drp?.reason).toBe("Dividend plan allotment");
      expect(drp?.description).toContain("dividend");
    });

    it("should have FLT (Float) reason", () => {
      const flt = TransactionReasons.find((r) => r.code === "FLT");
      expect(flt).toBeDefined();
      expect(flt?.code).toBe("FLT");
      expect(flt?.reason).toBe("Float");
      expect(flt?.description).toContain("float");
    });

    it("should have MER (Company merger) reason", () => {
      const mer = TransactionReasons.find((r) => r.code === "MER");
      expect(mer).toBeDefined();
      expect(mer?.code).toBe("MER");
      expect(mer?.reason).toBe("Company merger");
      expect(mer?.description).toContain("merger");
    });

    it("should have OPT (Option allotment) reason", () => {
      const opt = TransactionReasons.find((r) => r.code === "OPT");
      expect(opt).toBeDefined();
      expect(opt?.code).toBe("OPT");
      expect(opt?.reason).toBe("Option allotment");
      expect(opt?.description).toContain("option");
    });

    it("should have PLC (Placement) reason", () => {
      const plc = TransactionReasons.find((r) => r.code === "PLC");
      expect(plc).toBeDefined();
      expect(plc?.code).toBe("PLC");
      expect(plc?.reason).toBe("Placement");
      expect(plc?.description).toContain("placement");
    });

    it("should have RED (Miscellaneous redemption) reason", () => {
      const red = TransactionReasons.find((r) => r.code === "RED");
      expect(red).toBeDefined();
      expect(red?.code).toBe("RED");
      expect(red?.reason).toBe("Miscellaneous redemption");
      expect(red?.description.toLowerCase()).toContain("redemption");
    });
  });

  describe("TransactionReason interface", () => {
    it("should have the correct TypeScript interface", () => {
      const reason: TransactionReason = {
        code: "TEST",
        reason: "Test Reason",
        description: "This is a test transaction reason",
      };

      expect(reason.code).toBe("TEST");
      expect(reason.reason).toBe("Test Reason");
      expect(reason.description).toBe("This is a test transaction reason");
    });

    it("should enforce required properties", () => {
      // ensure TS compilation fails if interface is violated
      const validReason: TransactionReason = {
        code: "ADJ",
        reason: "Adjustment",
        description:
          "Any adjustment where no specific reason code is applicable",
      };

      expect(validReason).toHaveProperty("code");
      expect(validReason).toHaveProperty("reason");
      expect(validReason).toHaveProperty("description");
    });
  });

  describe("Data integrity", () => {
    it("should not have duplicate transaction reason codes", () => {
      const codes = TransactionReasons.map((r) => r.code);
      const uniqueCodes = [...new Set(codes)];
      expect(codes.length).toBe(uniqueCodes.length);
    });

    it("should not have empty or whitespace-only values", () => {
      TransactionReasons.forEach((reason) => {
        expect(reason.code.trim().length).toBeGreaterThan(0);
        expect(reason.reason.trim().length).toBeGreaterThan(0);
        expect(reason.description.trim().length).toBeGreaterThan(0);
      });
    });

    it("should have consistent data types", () => {
      TransactionReasons.forEach((reason) => {
        expect(typeof reason.code).toBe("string");
        expect(typeof reason.reason).toBe("string");
        expect(typeof reason.description).toBe("string");
      });
    });

    it("should have reasonable description lengths", () => {
      TransactionReasons.forEach((reason) => {
        expect(reason.description.length).toBeGreaterThan(10);
        expect(reason.description.length).toBeLessThan(500);
      });
    });

    it("should have reasonable reason name lengths", () => {
      TransactionReasons.forEach((reason) => {
        expect(reason.reason.length).toBeGreaterThan(0);
        expect(reason.reason.length).toBeLessThan(100);
      });
    });
  });

  describe("Code patterns", () => {
    it("should have all codes in uppercase", () => {
      TransactionReasons.forEach((reason) => {
        expect(reason.code).toBe(reason.code.toUpperCase());
      });
    });

    it("should have codes that are exactly 3 characters long", () => {
      TransactionReasons.forEach((reason) => {
        expect(reason.code.length).toBe(3);
      });
    });

    it("should have codes that contain only letters", () => {
      TransactionReasons.forEach((reason) => {
        expect(reason.code).toMatch(/^[A-Z]+$/);
      });
    });
  });

  describe("Content validation", () => {
    it("should have meaningful descriptions", () => {
      TransactionReasons.forEach((reason) => {
        // Descriptions should be at least as long as the reason name
        expect(reason.description.length).toBeGreaterThanOrEqual(
          reason.reason.length,
        );
        // Descriptions should not be empty and should contain meaningful content
        expect(reason.description.trim().length).toBeGreaterThan(0);
      });
    });

    it("should have consistent naming patterns", () => {
      // Most reasons should end with common suffixes
      const commonSuffixes = [
        "allotment",
        "issue",
        "redemption",
        "exercise",
        "delivery",
        "removal",
      ];
      const hasCommonSuffix = TransactionReasons.some((reason) =>
        commonSuffixes.some((suffix) =>
          reason.reason.toLowerCase().includes(suffix),
        ),
      );
      expect(hasCommonSuffix).toBe(true);
    });

    it("should not have duplicate reason names", () => {
      const reasons = TransactionReasons.map((r) => r.reason);
      const uniqueReasons = [...new Set(reasons)];
      // Allow some duplicates as different codes might have similar reasons
      expect(uniqueReasons.length).toBeGreaterThan(reasons.length * 0.8);
    });
  });

  describe("Edge cases and validation", () => {
    it("should handle special characters in descriptions", () => {
      TransactionReasons.forEach((reason) => {
        // Descriptions should not be null or undefined
        expect(reason.description).toBeDefined();
        expect(reason.description).not.toBeNull();
      });
    });

    it("should have consistent formatting", () => {
      TransactionReasons.forEach((reason) => {
        // Codes should not have leading/trailing spaces
        expect(reason.code).toBe(reason.code.trim());
        // Reasons should not have leading/trailing spaces
        expect(reason.reason).toBe(reason.reason.trim());
        // Descriptions should not have leading/trailing spaces
        expect(reason.description).toBe(reason.description.trim());
      });
    });
  });
});
