import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/api/audit.api';
import { Spinner } from '@/components/ui/Spinner';
import type { AuditLog, AuditService } from '@/types';

const SERVICES: { value: AuditService; label: string }[] = [
  { value: 'auth', label: 'Auth Service' },
  { value: 'users', label: 'User Service' },
  { value: 'tweets', label: 'Tweet Service' },
  { value: 'notifications', label: 'Notification Service' },
];

function JsonCell({ value }: { value: Record<string, unknown> | null }) {
  const [expanded, setExpanded] = useState(false);
  if (!value) return <span className="text-gray-400">—</span>;
  const preview = JSON.stringify(value).slice(0, 40);
  return (
    <div className="font-mono text-xs">
      <button onClick={() => setExpanded((v) => !v)} className="text-blue-600 hover:underline">
        {expanded ? '▲ collapse' : `▶ ${preview}…`}
      </button>
      {expanded && (
        <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AdminAuditPage() {
  const [service, setService] = useState<AuditService>('auth');
  const [userId, setUserId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [commandName, setCommandName] = useState('');
  const [successFilter, setSuccessFilter] = useState<'' | 'true' | 'false'>('');
  const [appliedFilters, setAppliedFilters] = useState({
    service: 'auth' as AuditService,
    userId: '',
    entityType: '',
    commandName: '',
    success: undefined as boolean | undefined,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit', appliedFilters],
    queryFn: () =>
      auditApi.getLogs(appliedFilters.service, {
        userId: appliedFilters.userId || undefined,
        entityType: appliedFilters.entityType || undefined,
        commandName: appliedFilters.commandName || undefined,
        success: appliedFilters.success,
        limit: 50,
      }),
    staleTime: 10_000,
  });

  const applyFilters = () => {
    setAppliedFilters({
      service,
      userId,
      entityType,
      commandName,
      success: successFilter === '' ? undefined : successFilter === 'true',
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Audit Log Viewer</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Service selector */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Service</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value as AuditService)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {SERVICES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* User ID */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">User ID</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. uuid"
            className="w-52 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Entity type */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Entity Type</label>
          <input
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            placeholder="e.g. Tweet"
            className="w-36 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Command name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Command</label>
          <input
            value={commandName}
            onChange={(e) => setCommandName(e.target.value)}
            placeholder="e.g. LoginCommand"
            className="w-44 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Success filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Success</label>
          <select
            value={successFilter}
            onChange={(e) => setSuccessFilter(e.target.value as '' | 'true' | 'false')}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All</option>
            <option value="true">✅ Success</option>
            <option value="false">❌ Failed</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={applyFilters}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load audit logs. Make sure you have admin access.
        </p>
      )}

      {data && (
        <>
          <p className="mb-3 text-sm text-gray-500">
            Showing <strong>{data.logs.length}</strong> log entries from{' '}
            <strong>{SERVICES.find((s) => s.value === appliedFilters.service)?.label}</strong>.
            {data.nextCursor && ' More entries available.'}
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 bg-white text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Command / Query</th>
                  <th className="px-4 py-3 text-left">Entity</th>
                  <th className="px-4 py-3 text-left">User ID</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-left">Old Data</th>
                  <th className="px-4 py-3 text-left">New Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.logs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      No audit logs found for the selected filters.
                    </td>
                  </tr>
                )}
                {data.logs.map((log: AuditLog) => (
                  <tr key={log.id} className={`hover:bg-gray-50 ${!log.success ? 'bg-red-50' : ''}`}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {log.success ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">✓ ok</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">✗ fail</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-gray-800">
                        {log.commandName ?? log.queryName ?? '—'}
                      </div>
                      {log.errorMessage && (
                        <div className="text-xs text-red-600">{log.errorMessage}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {log.entityType ?? '—'}
                      {log.entityId && (
                        <div className="font-mono text-gray-400">{log.entityId.slice(0, 8)}…</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {log.userId ? `${log.userId.slice(0, 8)}…` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {log.durationMs != null ? `${log.durationMs}ms` : '—'}
                    </td>
                    <td className="px-4 py-3"><JsonCell value={log.oldData} /></td>
                    <td className="px-4 py-3"><JsonCell value={log.newData} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
