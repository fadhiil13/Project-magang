'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/auth';
import { usePageTitle } from '@/lib/pageTitle';
import api from '@/lib/api';
import { User } from '@/types';

// Schemas
const createUserSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  nama: z.string().min(1, 'Nama wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['USER', 'ADMIN']),
});

const editUserSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  password: z.string().optional().refine((v) => !v || v.length >= 6, 'Password minimal 6 karakter'),
  role: z.enum(['USER', 'ADMIN']),
});

type CreateUserData = z.infer<typeof createUserSchema>;
type EditUserData = z.infer<typeof editUserSchema>;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

const roleOptions = [
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
];

export default function AdminUsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const router = useRouter();
  usePageTitle('Kelola User');

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirect non-admin
  useEffect(() => {
    if (!isAdmin) router.replace('/dashboard');
  }, [isAdmin, router]);

  const fetchUsers = async () => {
    try {
      const res = await api.get<User[]>('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  // ── Create ──
  const createForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { username: '', nama: '', password: '', role: 'USER' },
  });

  const handleCreate = async (data: CreateUserData) => {
    setSubmitting(true);
    try {
      await api.post('/auth/register', data);
      toast.success('User berhasil ditambahkan');
      setShowCreate(false);
      createForm.reset();
      fetchUsers();
    } catch (err: any) {
      if (err.response?.status === 409) {
        createForm.setError('username', { message: 'Username sudah digunakan' });
      } else {
        toast.error('Gagal menambahkan user');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ──
  const editForm = useForm<EditUserData>({
    resolver: zodResolver(editUserSchema),
  });

  const openEdit = (u: User) => {
    setEditTarget(u);
    editForm.reset({ nama: u.nama, password: '', role: u.role });
  };

  const handleEdit = async (data: EditUserData) => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      const payload: any = { nama: data.nama, role: data.role };
      if (data.password) payload.password = data.password;
      await api.patch(`/users/${editTarget.id}`, payload);
      toast.success('User berhasil diperbarui');
      setEditTarget(null);
      fetchUsers();
    } catch {
      toast.error('Gagal memperbarui user');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success('User berhasil dihapus');
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error('Gagal menghapus user');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-end">
        <Button onClick={() => { createForm.reset(); setShowCreate(true); }}>
          <Plus className="w-4 h-4" /> Tambah User
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Memuat user..." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-kai-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-kai-navy text-white">
                <th className="px-4 py-3 text-left font-semibold">Username</th>
                <th className="px-4 py-3 text-left font-semibold">Nama</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-left font-semibold">Dibuat</th>
                <th className="px-4 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-kai-gray-500">
                    Belum ada user.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-t border-kai-gray-200 even:bg-kai-gray-50 hover:bg-kai-gray-100 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{u.username}</td>
                      <td className="px-4 py-3">{u.nama}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'ADMIN' ? 'admin' : 'user'}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {u.createdAt ? formatDate(u.createdAt) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            title="Edit"
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-md text-kai-gray-500 hover:bg-kai-gray-100 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            title={isSelf ? 'Tidak bisa hapus diri sendiri' : 'Hapus'}
                            onClick={() => !isSelf && setDeleteTarget(u)}
                            disabled={isSelf}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Modal ── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Tambah User Baru"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Batal
            </Button>
            <Button loading={submitting} onClick={createForm.handleSubmit(handleCreate)}>
              💾 Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Username *"
            placeholder="username"
            error={createForm.formState.errors.username?.message}
            {...createForm.register('username')}
          />
          <Input
            label="Nama Lengkap *"
            placeholder="Nama lengkap"
            error={createForm.formState.errors.nama?.message}
            {...createForm.register('nama')}
          />
          <Input
            label="Password *"
            type="password"
            placeholder="Minimal 6 karakter"
            error={createForm.formState.errors.password?.message}
            {...createForm.register('password')}
          />
          <Select
            label="Role"
            options={roleOptions}
            {...createForm.register('role')}
          />
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit User: ${editTarget?.username}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)}>
              Batal
            </Button>
            <Button loading={submitting} onClick={editForm.handleSubmit(handleEdit)}>
              💾 Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nama Lengkap *"
            placeholder="Nama lengkap"
            error={editForm.formState.errors.nama?.message}
            {...editForm.register('nama')}
          />
          <Input
            label="Password (kosongkan jika tidak ingin ganti)"
            type="password"
            placeholder="Minimal 6 karakter"
            error={editForm.formState.errors.password?.message}
            {...editForm.register('password')}
          />
          <Select
            label="Role"
            options={roleOptions}
            {...editForm.register('role')}
          />
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="danger" loading={submitting} onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-kai-gray-700">
          Yakin ingin menghapus user <span className="font-semibold">{deleteTarget?.username}</span>?
          Tindakan ini tidak bisa dibatalkan.
        </p>
      </Modal>
    </div>
  );
}