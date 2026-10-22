export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export function okResult<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function errorResult(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { success: false, error, fieldErrors };
}
