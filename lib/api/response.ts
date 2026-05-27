import { NextResponse } from "next/server";

/**
 * Standard JSON envelope returned by every route in `app/api/*`.
 * Clients can branch on `ok` without inspecting HTTP status, and `data`/`error`
 * are mutually exclusive so types stay simple at call sites.
 */
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type Init = Omit<ResponseInit, "status"> & { status?: number };

export function apiOk<T>(data: T, init?: Init): NextResponse<ApiResponse<T>> {
  return NextResponse.json<ApiResponse<T>>(
    { ok: true, data },
    { status: 200, ...init },
  );
}

export function apiError(
  error: string,
  status: number,
  init?: Omit<ResponseInit, "status">,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json<ApiResponse<never>>(
    { ok: false, error },
    { ...init, status },
  );
}
