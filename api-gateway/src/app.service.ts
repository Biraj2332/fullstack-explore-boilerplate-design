import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const UPSTREAM: Record<string, string> = {
  auth:          process.env.AUTH_SERVICE_URL         ?? 'http://localhost:3001',
  users:         process.env.USER_SERVICE_URL         ?? 'http://localhost:3002',
  notifications: process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3003',
  tweets:        process.env.TWEET_SERVICE_URL        ?? 'http://localhost:3004',
  media:         process.env.MEDIA_SERVICE_URL        ?? 'http://localhost:3005',
};

// In-process request counter (per restart). In production replace with Prometheus.
const metrics = {
  requests:  0,
  errors:    0,
  startedAt: new Date().toISOString(),
};

export function recordRequest() { metrics.requests++; }
export function recordError()   { metrics.errors++;   }

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getStatus() {
    return { service: 'api-gateway', status: 'ok', timestamp: new Date().toISOString() };
  }

  /** Liveness probe — process is alive */
  getLiveness() {
    return { status: 'ok', pid: process.pid, uptime: process.uptime() };
  }

  /** Readiness probe — aggregate health of downstream services */
  async getReadiness() {
    const results = await Promise.allSettled(
      Object.entries(UPSTREAM).map(async ([name, base]) => {
        const start = Date.now();
        const resp = await axios.get(`${base}/api/health`, { timeout: 3000 });
        return { name, status: resp.status === 200 ? 'ok' : 'degraded', latencyMs: Date.now() - start };
      }),
    );

    const services: Record<string, unknown> = {};
    let allOk = true;
    for (const r of results) {
      if (r.status === 'fulfilled') {
        services[r.value.name] = { status: r.value.status, latencyMs: r.value.latencyMs };
        if (r.value.status !== 'ok') allOk = false;
      } else {
        const msg = (r.reason as Error).message;
        const name = msg; // approximate; extract from error detail if needed
        allOk = false;
        services['unknown'] = { status: 'down', error: msg };
      }
    }

    return {
      status: allOk ? 'ok' : 'degraded',
      services,
      timestamp: new Date().toISOString(),
    };
  }

  /** Prometheus-compatible text metrics */
  getMetrics() {
    const mem = process.memoryUsage();
    return [
      `# HELP gateway_requests_total Total requests since last restart`,
      `# TYPE gateway_requests_total counter`,
      `gateway_requests_total ${metrics.requests}`,
      `# HELP gateway_errors_total Total errors since last restart`,
      `# TYPE gateway_errors_total counter`,
      `gateway_errors_total ${metrics.errors}`,
      `# HELP gateway_uptime_seconds Process uptime`,
      `# TYPE gateway_uptime_seconds gauge`,
      `gateway_uptime_seconds ${process.uptime().toFixed(2)}`,
      `# HELP gateway_heap_used_bytes Heap used`,
      `# TYPE gateway_heap_used_bytes gauge`,
      `gateway_heap_used_bytes ${mem.heapUsed}`,
      '',
    ].join('\n');
  }
}
