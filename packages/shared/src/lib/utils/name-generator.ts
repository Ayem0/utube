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

function randomSuffix(length: number = 6) {
  const buffer = new Uint8Array(length);
  const num = crypto.getRandomValues(buffer);

  let out = "";
  for (const n of num) {
    console.log("random num", n);
    out += n.toString(36);
    console.log("out", out);
  }
  console.log("out final", out);
  return out;
}
