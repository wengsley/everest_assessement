/**
 * HttpError type used for expected API failures.
 * @author wengsley
 */

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function notFound(entity: string): HttpError {
  return new HttpError(404, `${entity} not found`);
}
