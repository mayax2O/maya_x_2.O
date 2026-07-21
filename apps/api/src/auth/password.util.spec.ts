import { hashPassword, verifyPassword } from "./password.util";

describe("password.util", () => {
  it("hashes a password into an argon2id digest, distinct from the plaintext", async () => {
    const hash = await hashPassword("Password1");
    expect(hash).not.toBe("Password1");
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("produces a different hash each time (random salt) but both verify", async () => {
    const [hashA, hashB] = await Promise.all([
      hashPassword("Password1"),
      hashPassword("Password1"),
    ]);
    expect(hashA).not.toBe(hashB);
    await expect(verifyPassword(hashA, "Password1")).resolves.toBe(true);
    await expect(verifyPassword(hashB, "Password1")).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("Password1");
    await expect(verifyPassword(hash, "WrongPassword1")).resolves.toBe(false);
  });
});
