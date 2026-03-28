import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

class SSEBroadcaster {
  private clients = new Map<string, (event: string, data: unknown) => void>();
  private clientId = 0;

  addClient(id: string, send: (event: string, data: unknown) => void) {
    this.clients.set(id, send);
  }

  removeClient(id: string) {
    this.clients.delete(id);
  }

  nextId(): string {
    return String(++this.clientId);
  }

  broadcast(event: string, data: unknown) {
    for (const send of this.clients.values()) {
      try {
        send(event, data);
      } catch {
        // Client may have disconnected
      }
    }
  }

  get clientCount() {
    return this.clients.size;
  }
}

export const broadcaster = new SSEBroadcaster();

export function broadcast(event: string, data: unknown) {
  broadcaster.broadcast(event, data);
}

const app = new Hono();

app.get('/api/events', (c) => {
  return streamSSE(c, async (stream) => {
    const clientId = broadcaster.nextId();

    const send = (event: string, data: unknown) => {
      stream.writeSSE({ event, data: JSON.stringify(data) });
    };

    broadcaster.addClient(clientId, send);

    // Send initial connection event
    await stream.writeSSE({ event: 'connected', data: JSON.stringify({ clientId }) });

    // Keep-alive ping every 30s
    const pingInterval = setInterval(() => {
      try {
        stream.writeSSE({ event: 'ping', data: JSON.stringify({ time: Date.now() }) });
      } catch {
        clearInterval(pingInterval);
      }
    }, 30_000);

    // Wait until client disconnects
    stream.onAbort(() => {
      clearInterval(pingInterval);
      broadcaster.removeClient(clientId);
    });

    // Keep stream open
    await new Promise(() => {});
  });
});

export default app;
