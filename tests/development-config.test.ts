import test from 'node:test';
import assert from 'node:assert/strict';
import type { NetworkInterfaceInfo } from 'node:os';
import { getDevelopmentOrigins } from '../src/Config/DevelopmentConfig';

const address = (
  value: string,
  family: 'IPv4' | 'IPv6' = 'IPv4',
  internal = false,
): NetworkInterfaceInfo => {
  const info = {
    address: value,
    internal,
    netmask: '255.255.255.0',
    mac: '00:00:00:00:00:00',
    cidr: null,
  };
  return family === 'IPv6' ? { ...info, family, scopeid: 0 } : { ...info, family };
};

test('開發白名單只包含本機實際的私有IPv4與迴路位址', () => {
  assert.deepEqual(
    getDevelopmentOrigins({
      Ethernet: [address('192.168.1.104'), address('192.168.1.104'), address('fe80::1', 'IPv6')],
      WiFi: [address('10.0.0.5'), address('172.16.2.8')],
      Public: [address('203.0.113.10'), address('172.32.0.1'), address('192.169.1.2')],
      Loopback: [address('127.0.0.1', 'IPv4', true)],
      Disabled: undefined,
    }),
    ['localhost', '127.0.0.1', '192.168.1.104', '10.0.0.5', '172.16.2.8'],
  );
});

test('無可用區網介面時，不放寬為任意來源', () => {
  const origins = getDevelopmentOrigins({});
  assert.deepEqual(origins, ['localhost', '127.0.0.1']);
  assert(!origins.some((origin) => origin.includes('*')));
});
