export function generateRandomNameFromEmail(email: string) {
  const p1 = email.split("@")[0];

  if (!p1) throw new Error("Invalid email");

  const base =
    p1
      .replace(/[^\p{L}\p{N}]+/gu, "") // extract only letters and numbers
      .toLowerCase()
      .slice(0, 20) ?? "user";

  const suffix = randomSuffix();

  return base + suffix;
}

const alphabet =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" as const;

function randomSuffix(length: number = 6) {
  const buffer = new Uint8Array(length);
  const num = crypto.getRandomValues(buffer);

  let out = "";
  for (const n of num) {
    out += alphabet[n % alphabet.length];
  }
  return out;
}
