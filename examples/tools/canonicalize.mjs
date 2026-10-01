// Canonicalization of a receipt for signing and hashing.
//
// The signature covers every receipt field EXCEPT `signature` itself, encoded
// as RFC 8785 (JSON Canonicalization Scheme) JSON: object keys sorted by UTF-16
// code units at every depth, no insignificant whitespace, strings and numbers
// serialized as ECMAScript JSON.stringify does (which is how RFC 8785 defines
// them), UTF-8 bytes.
//
// Every signed field in the v0.1 Receipt primitive is a JSON string, for which
// this reduces to sorted-key `JSON.stringify`. Nested objects, arrays, numbers,
// booleans and null are canonicalized too, so a receipt carrying a non-string
// field still yields the RFC 8785 bytes a JCS signer would have produced.
//
// The output is built as a string rather than by assigning into a fresh object:
// a JSON-parsed receipt can carry an own "__proto__" key, and assigning that key
// sets the object's prototype instead of creating a property -- which silently
// dropped the field from the signed bytes, so it could be added to a receipt
// without invalidating the signature.

/**
 * Serialize a JSON value as RFC 8785 canonical JSON.
 * @param {unknown} value - a JSON value (as produced by JSON.parse).
 * @returns {string}
 */
export function canonicalJson(value) {
  if (value === null || typeof value !== "object") {
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new TypeError(`cannot canonicalize non-finite number ${value}`);
    }
    if (value !== null && !["string", "number", "boolean"].includes(typeof value)) {
      throw new TypeError(`cannot canonicalize ${typeof value}`);
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalJson).join(",") + "]";
  }
  const members = Object.keys(value)
    .sort()
    .map((k) => JSON.stringify(k) + ":" + canonicalJson(value[k]));
  return "{" + members.join(",") + "}";
}

/**
 * Return the canonical UTF-8 bytes signed for a receipt.
 * @param {Record<string, unknown>} receipt - a receipt object, with or without `signature`.
 * @returns {Buffer}
 */
export function canonicalSigningInput(receipt) {
  const { signature, ...signed } = receipt;
  return Buffer.from(canonicalJson(signed), "utf8");
}
