import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { version as uuidVersion, validate as uuidValidate } from "uuid";
export { v4 as uuidv4 } from "uuid";

export function isValidUUIDv4(uuid: string): boolean {
  return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
