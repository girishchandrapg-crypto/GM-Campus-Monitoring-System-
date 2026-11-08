import { describe,expect,it } from "vitest";
import {validateFacultyLeave} from "@/lib/faculty-leave";
describe("Faculty leave rules",()=>{
  it("rejects past start dates",()=>expect(validateFacultyLeave("2026-11-04","2026-11-06","Medical appointment","2026-11-05")).toBe("Start date cannot be in the past."));
  it("rejects an end before the start",()=>expect(validateFacultyLeave("2026-11-06","2026-11-05","Medical appointment","2026-11-05")).toBe("End date must be on or after the start date."));
  it("requires a 10–500 character reason",()=>{expect(validateFacultyLeave("2026-11-05","2026-11-05","short","2026-11-05")).toBe("Reason must be 10–500 characters.");expect(validateFacultyLeave("2026-11-05","2026-11-05","x".repeat(501),"2026-11-05")).toBe("Reason must be 10–500 characters.");});
  it("accepts a valid request",()=>expect(validateFacultyLeave("2026-11-05","2026-11-06","Medical appointment","2026-11-05")).toBeNull());
});