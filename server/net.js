// =============================================================================
// server/net.js — utilidades de red (sin estado, testeables sin abrir sockets).
// =============================================================================

import os from 'node:os';

/**
 * Devuelve la primera IPv4 no interna (la IP de la LAN), o 'localhost' si no
 * hay ninguna interfaz de red disponible.
 */
export function lanAddress() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const info of ifaces[name] || []) {
      if (info.family === 'IPv4' && !info.internal) return info.address;
    }
  }
  return 'localhost';
}
