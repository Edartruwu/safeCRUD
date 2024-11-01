import { POST } from "./methods/post";

import type { PostConfig } from "./methods/post";

export type { PostConfig, GetConfig };

import { ContentType } from "./types/enums";
import { HttpError, ValidationError } from "./utils/classes";

import { GET } from "./methods/get";
import type { GetConfig } from "./methods/get";
export { ContentType, POST, HttpError, ValidationError, GET };
