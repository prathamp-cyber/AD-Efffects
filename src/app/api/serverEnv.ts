import 'server-only';

type ServerEnvKey =
  | 'ADMIN_USERNAME'
  | 'ADMIN_PASSWORD'
  | 'SUPER_ADMIN_USERNAME'
  | 'SUPER_ADMIN_PASSWORD'
  | 'ADMIN_SESSION_SECRET'
  | 'UPSTASH_REDIS_REST_URL'
  | 'UPSTASH_REDIS_REST_TOKEN'
  | 'KV_REST_API_URL'
  | 'KV_REST_API_TOKEN'
  | 'NODE_ENV';

export function getServerEnv(key: ServerEnvKey): string {
  return process.env[key] || '';
}
