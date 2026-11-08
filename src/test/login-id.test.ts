import { describe, expect, it } from "vitest";
import { normalizeLoginId } from "@/lib/login-id";
describe("Campus sign-in IDs", () => {
  it("accepts and normalizes USN", () => expect(normalizeLoginId(" gmu2301 ")).toBe("GMU2301"));
  it("accepts Admin IDs", () => expect(normalizeLoginId("admin")).toBe("ADMIN"));
  it("accepts Faculty IDs", () => expect(normalizeLoginId("fac101")).toBe("FAC101"));
  it("does not accept an email as an ID", () => expect(() => normalizeLoginId("student@gmu.ac.in")).toThrow());
});