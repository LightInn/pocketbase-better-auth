import { describe, it, expect } from "vitest";
import { pocketBaseAdapter, parseWhere } from "./index";

describe("pocketBaseAdapter", () => {
  it("should export pocketBaseAdapter function", () => {
    expect(pocketBaseAdapter).toBeDefined();
    expect(typeof pocketBaseAdapter).toBe("function");
  });

  it("should export parseWhere function", () => {
    expect(parseWhere).toBeDefined();
    expect(typeof parseWhere).toBe("function");
  });

  describe("parseWhere", () => {
    it("should return empty string for empty where clause", () => {
      expect(parseWhere()).toBe("");
      expect(parseWhere([])).toBe("");
    });

    it("should parse eq operator", () => {
      const result = parseWhere([{ field: "email", operator: "eq", value: "test@example.com" }]);
      expect(result).toBe('email = "test@example.com"');
    });

    it("should parse ne operator", () => {
      const result = parseWhere([{ field: "status", operator: "ne", value: "active" }]);
      expect(result).toBe('status != "active"');
    });

    it("should parse in operator", () => {
      const result = parseWhere([{ field: "id", operator: "in", value: ["1", "2", "3"] }]);
      expect(result).toBe('id ?~ ["1", "2", "3"]');
    });

    it("should parse contains operator", () => {
      const result = parseWhere([{ field: "name", operator: "contains", value: "john" }]);
      expect(result).toBe('name ~ "john"');
    });

    it("should parse starts_with operator", () => {
      const result = parseWhere([{ field: "email", operator: "starts_with", value: "admin" }]);
      expect(result).toBe('email ~ "admin%"');
    });

    it("should parse ends_with operator", () => {
      const result = parseWhere([{ field: "email", operator: "ends_with", value: "@example.com" }]);
      expect(result).toBe('email ~ "%@example.com"');
    });

    it("should parse gt operator", () => {
      const result = parseWhere([{ field: "age", operator: "gt", value: 18 }]);
      expect(result).toBe('age > 18');
    });

    it("should parse gte operator", () => {
      const result = parseWhere([{ field: "score", operator: "gte", value: 100 }]);
      expect(result).toBe('score >= 100');
    });

    it("should parse lt operator", () => {
      const result = parseWhere([{ field: "price", operator: "lt", value: 50 }]);
      expect(result).toBe('price < 50');
    });

    it("should parse lte operator", () => {
      const result = parseWhere([{ field: "quantity", operator: "lte", value: 10 }]);
      expect(result).toBe('quantity <= 10');
    });

    it("should combine multiple conditions with &&", () => {
      const result = parseWhere([
        { field: "status", operator: "eq", value: "active" },
        { field: "age", operator: "gte", value: 18 }
      ]);
      expect(result).toBe('status = "active" && age >= 18');
    });

    it("should handle numeric values without quotes", () => {
      const result = parseWhere([{ field: "count", operator: "eq", value: 42 }]);
      expect(result).toBe('count = 42');
    });
  });

  describe("pocketBaseAdapter config", () => {
    it("should accept PocketBase instance", () => {
      const mockPb = { 
        collection: () => ({}),
        authStore: { isValid: false },
        admins: { authWithPassword: async () => {} }
      };
      
      const adapter = pocketBaseAdapter({
        pb: mockPb as any,
        usePlural: false,
        debugLogs: false,
      });

      expect(adapter).toBeDefined();
      expect(typeof adapter).toBe("function");
    });

    it("should accept configuration object", () => {
      const adapter = pocketBaseAdapter({
        pb: {
          url: "http://127.0.0.1:8090",
          adminEmail: "test@example.com",
          adminPassword: "password",
        },
        usePlural: true,
        debugLogs: true,
      });

      expect(adapter).toBeDefined();
      expect(typeof adapter).toBe("function");
    });
  });
});
