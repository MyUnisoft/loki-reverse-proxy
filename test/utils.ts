// Import Node.js Dependencies
import * as crypto from "node:crypto";

export function generateBearer(
  token = crypto.randomBytes(4).toString("hex")
) {
  return {
    authorization: `Bearer ${token}`,
    token
  };
}
