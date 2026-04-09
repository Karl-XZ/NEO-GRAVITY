import "server-only";

function requireEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY",
) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildRestUrl(path: string, query?: string) {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  const base = `${supabaseUrl}/rest/v1/${normalized}`;
  return query ? `${base}?${query}` : base;
}

export async function fetchRestJson<T>(
  path: string,
  query?: string,
  init?: RequestInit,
): Promise<T> {
  const url = buildRestUrl(path, query);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const responseError = new Error(
          `Supabase request failed for ${path}: ${response.status} ${response.statusText}`,
        );

        if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === 2) {
          throw responseError;
        }

        lastError = responseError;
      } else {
        return (await response.json()) as T;
      }
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error(`Supabase request failed for ${path}.`);

      if (attempt === 2) {
        break;
      }
    }

    await sleep(400 * (attempt + 1));
  }

  throw lastError ?? new Error(`Supabase request failed for ${path}.`);
}
