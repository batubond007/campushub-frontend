import { FormEvent, useCallback, useEffect, useState } from 'react';
import RequireAuth from '../components/RequireAuth';
import { AccountStatus, AdminUser, api, ApiError, Page, Role, roleLabels } from '../api';
import { useAuth } from '../auth';

const roles: Role[] = ['STUDENT', 'CLUB_MANAGER', 'UNIVERSITY_ADMIN', 'SYSTEM_ADMIN'];
const statusLabels: Record<AccountStatus, string> = {
  PENDING_VERIFICATION: 'Not verified',
  ACTIVE: 'Active',
  DISABLED: 'Disabled',
};

/** US-05: manage users and roles. */
function UserManager() {
  const { token, user: me } = useAuth();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<AdminUser> | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), size: '20' });
    if (search) params.set('query', search);
    api<Page<AdminUser>>(`/api/admin/users?${params}`, { token })
      .then(setData)
      .catch((e) => setMessage({ kind: 'error', text: e instanceof ApiError ? e.message : 'Could not load users.' }));
  }, [page, search, token]);

  useEffect(load, [load]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setSearch(query.trim());
  }

  async function update(user: AdminUser, change: { role?: Role; status?: AccountStatus }) {
    setMessage(null);
    const path = change.role ? `/api/admin/users/${user.id}/role` : `/api/admin/users/${user.id}/status`;
    try {
      const updated = await api<AdminUser>(path, { method: 'PUT', token, body: change });
      setData((current) => current && {
        ...current,
        content: current.content.map((u) => (u.id === updated.id ? updated : u)),
      });
      setMessage({ kind: 'success', text: `Updated ${updated.fullName}. They need to log in again.` });
    } catch (e) {
      if (e instanceof ApiError) setMessage({ kind: 'error', text: e.message });
    }
  }

  return (
    <>
      <h1>Users and roles</h1>
      <form className="search" onSubmit={handleSearch} role="search">
        <label htmlFor="user-search" className="visually-hidden">Search by name or e-mail</label>
        <input id="user-search" value={query} placeholder="Search by name or e-mail"
               onChange={(e) => setQuery(e.target.value)} />
        <button type="submit" className="button">Search</button>
      </form>
      {message && (
        <p className={`alert ${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p>
      )}
      {!data && <p className="muted">Loading users…</p>}
      {data && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>E-mail</th><th>Role</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.content.map((u) => {
                const self = u.id === me?.id;
                return (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <select aria-label={`Role of ${u.fullName}`} value={u.role} disabled={self}
                              onChange={(e) => update(u, { role: e.target.value as Role })}>
                        {roles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
                      </select>
                    </td>
                    <td>
                      {u.status === 'PENDING_VERIFICATION' ? (
                        <span className="muted">{statusLabels[u.status]}</span>
                      ) : (
                        <select aria-label={`Status of ${u.fullName}`} value={u.status} disabled={self}
                                onChange={(e) => update(u, { status: e.target.value as AccountStatus })}>
                          <option value="ACTIVE">Active</option>
                          <option value="DISABLED">Disabled</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data.content.length === 0 && (
                <tr><td colSpan={4} className="muted">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {data && data.totalPages > 1 && (
        <div className="pager">
          <button type="button" className="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="muted">Page {page + 1} of {data.totalPages}</span>
          <button type="button" className="button" disabled={page + 1 >= data.totalPages}
                  onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <RequireAuth roles={['SYSTEM_ADMIN']}>
      <UserManager />
    </RequireAuth>
  );
}
