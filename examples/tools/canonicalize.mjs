// Canonicalization of a receipt for signing and hashing.
//
// The signature covers every receipt field EXCEPT `signature` itself, encoded
// as canonical JSON: keys sorted lexicographically (UTF-16 code-unit order, as
// produced by Array.prototype.sort), no insignificant whitespace, UTF-8 bytes.
//
// Every signed field in the Receipt primitive is a JSON string, so this is a
// deterministic subset of RFC 8785 (JSON Canonicalization Scheme): with no
// numbers, booleans, nulls, or nested objects to normalize, sorted-key
// `JSON.stringify` already yields the JCS form. Implementations that add
// non-string fields in a future spec version must adopt full RFC 8785.

/**
 * Return the canonical UTF-8 bytes signed for a receipt.
 * @param {Record<string, unknown>} receipt - a receipt object, with or without `signature`.
 * @returns {Buffer}
 */
export function canonicalSigningInput(receipt) {
  const { signature, ...signed } = receipt;
  const sortedKeys = Object.keys(signed).sort();
  const canonical = {};
  for (const k of sortedKeys) canonical[k] = signed[k];
  return Buffer.from(JSON.stringify(canonical), "utf8");
}
