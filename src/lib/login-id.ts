export function normalizeLoginId(value: string) {
  const id = value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(id)) throw new Error("Enter a valid USN, Admin ID or Faculty ID (2–30 letters or numbers).");
  return id;
}
/** Sign-in identifier: Admin must type "ADMIN" in capitals, Faculty type their name, Students type their USN. */
export function signInIdentifier(value: string) {
  const id = value.trim().replace(/\s+/g, " ");
  if (id.toUpperCase() === "ADMIN" && id !== "ADMIN") throw new Error("Admin ID must be typed in capital letters (ADMIN).");
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._'-]{1,59}$/.test(id)) throw new Error("Enter your USN, Faculty name or Admin ID.");
  return id;
}
