import {
  v4 as uuidv4,
  version as uuidVersion,
  validate as uuidValidate,
} from "uuid";

function uuidValidateV4(uuid: string): boolean {
  return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}

export { uuidv4, uuidValidateV4 };
