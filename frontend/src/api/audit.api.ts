import api from './axios';
import type { AuditLogsResponse, AuditService } from '@/types';

interface AuditLogsParams {
  userId?: string;
  entityType?: string;
  commandName?: string;
  success?: boolean;
  limit?: number;
  cursor?: string;
}

const SERVICE_PATH: Record<AuditService, string> = {
  auth: '/auth/audit-logs',
  users: '/users/audit-logs',
  tweets: '/tweets/audit-logs',
  notifications: '/notifications/audit-logs',
};

export const auditApi = {
  getLogs: async (service: AuditService, params: AuditLogsParams = {}): Promise<AuditLogsResponse> => {
    const query: Record<string, string> = {};
    if (params.userId) query.userId = params.userId;
    if (params.entityType) query.entityType = params.entityType;
    if (params.commandName) query.commandName = params.commandName;
    if (params.success !== undefined) query.success = String(params.success);
    if (params.limit) query.limit = String(params.limit);
    if (params.cursor) query.cursor = params.cursor;
    const { data } = await api.get<AuditLogsResponse>(SERVICE_PATH[service], { params: query });
    return data;
  },
};
