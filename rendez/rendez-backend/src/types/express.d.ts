import { Request } from 'express';

/**
 * Extended Express Request with rawBody.
 *
 * The rawBody field is populated in src/index.ts by the express.json()
 * verify callback so that webhook HMAC verification uses the exact
 * bytes received over the wire (not a re-serialized body, which can
 * alter non-ASCII characters or whitespace ordering).
 */
export interface RawBodyRequest extends Request {
  rawBody: string;
}
