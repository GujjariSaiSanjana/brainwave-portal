import { decrypt, encrypt, randomToken, sha256 } from "../src/lib/crypto";

const key = Buffer.alloc(32, 1).toString("base64");

describe("crypto", () => {
  it("round-trips encrypted values", () => {
    const secret = "1000.abcdef.refresh-token";
    const enc = encrypt(secret, key);
    expect(enc).not.toContain(secret);
    expect(decrypt(enc, key)).toBe(secret);
  });

  it("produces a different ciphertext each time", () => {
    expect(encrypt("same", key)).not.toBe(encrypt("same", key));
  });

  it("rejects tampered ciphertext", () => {
    const enc = Buffer.from(encrypt("payload", key), "base64");
    enc[enc.length - 1] = enc[enc.length - 1]! ^ 0xff;
    expect(() => decrypt(enc.toString("base64"), key)).toThrow();
  });

  it("hashes deterministically and generates unique tokens", () => {
    expect(sha256("a")).toBe(sha256("a"));
    expect(randomToken()).not.toBe(randomToken());
  });
});
