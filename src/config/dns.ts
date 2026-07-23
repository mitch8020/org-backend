import { setServers } from 'node:dns';
import { isIP } from 'node:net';

export function parseDnsServers(value?: string): string[] {
  const servers = (value ?? '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.some((server) => isIP(server) === 0)) {
    throw new Error('DNS_SERVERS must contain comma-separated IP addresses.');
  }

  return servers;
}

export function configureDnsServers(value?: string): string[] {
  const servers = parseDnsServers(value);
  if (servers.length > 0) setServers(servers);
  return servers;
}
