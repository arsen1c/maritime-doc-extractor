import { createHash } from "node:crypto";

// create file hash
export function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}
