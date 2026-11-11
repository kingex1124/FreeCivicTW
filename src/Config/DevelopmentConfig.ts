import { networkInterfaces } from 'node:os';

function isPrivateIPv4(address: string) {
  const parts = address.split('.').map(Number);
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }
  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

// Trust only this computer's actual private interfaces, never an entire subnet or wildcard origin.
export function getDevelopmentOrigins(interfaces = networkInterfaces()): string[] {
  const localAddresses = Object.values(interfaces)
    .flatMap((entries) => entries ?? [])
    .filter((entry) => !entry.internal && entry.family === 'IPv4' && isPrivateIPv4(entry.address))
    .map((entry) => entry.address);
  return [...new Set(['localhost', '127.0.0.1', ...localAddresses])];
}
