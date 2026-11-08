import { describe, it, expect } from "vitest";
import { signInIdentifier } from "@/lib/login-id";
describe("sign-in identifier", () => {
  it("accepts ADMIN in capitals", () => expect(signInIdentifier(" ADMIN ")).toBe("ADMIN"));
  it("rejects admin in lower/mixed case", () => { expect(() => signInIdentifier("admin")).toThrow(); expect(() => signInIdentifier("Admin")).toThrow(); });
  it("accepts a faculty name with spaces", () => expect(signInIdentifier("Lakshmi   Rao")).toBe("Lakshmi Rao"));
  it("accepts a student USN", () => expect(signInIdentifier("GMU1001")).toBe("GMU1001"));
});
