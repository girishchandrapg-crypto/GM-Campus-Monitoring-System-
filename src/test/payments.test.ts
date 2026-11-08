import { expect, it } from "vitest";
import { duesFor } from "@/lib/payments";
import { SUBJECTS, type Student } from "@/lib/campus";
const base = (o: Partial<Student>): Student => ({ id: "GMU2302", name: "T", dept: "CSE", sem: 1, email: "", attended: 100, totalClasses: 100, marks: Object.fromEntries(SUBJECTS.map((s) => [s, 80])) as Student["marks"], ...o });
it("day scholar with good record pays only tuition", () => { expect(duesFor(base({})).map((d) => d.key)).toEqual(["fee"]); });
it("hostel, shortage and re-exam dues appear when applicable", () => {
  const d = duesFor(base({ id: "GMU2301", attended: 50, marks: { ...base({}).marks, Mathematics: 30 } }));
  expect(d.map((x) => x.key)).toEqual(["fee", "hostel", "shortage", "reexam"]);
  expect(d.find((x) => x.key === "reexam")!.amount).toBe(1500);
});
