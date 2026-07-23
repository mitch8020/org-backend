import { setServers } from 'node:dns';
import { configureDnsServers, parseDnsServers } from './dns';

jest.mock('node:dns', () => ({
  setServers: jest.fn(),
}));

describe('DNS configuration', () => {
  beforeEach(() => {
    jest.mocked(setServers).mockClear();
  });

  it('parses and applies comma-separated IPv4 and IPv6 resolvers', () => {
    expect(configureDnsServers('1.1.1.1, 2001:4860:4860::8888')).toEqual([
      '1.1.1.1',
      '2001:4860:4860::8888',
    ]);
    expect(setServers).toHaveBeenCalledWith([
      '1.1.1.1',
      '2001:4860:4860::8888',
    ]);
  });

  it('leaves the operating-system resolver unchanged when unset', () => {
    expect(configureDnsServers()).toEqual([]);
    expect(setServers).not.toHaveBeenCalled();
  });

  it('rejects hostnames and malformed resolver addresses', () => {
    expect(() => parseDnsServers('dns.example.com')).toThrow(
      'DNS_SERVERS must contain comma-separated IP addresses.',
    );
  });
});
