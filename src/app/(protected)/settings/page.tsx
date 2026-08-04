'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllAdmins,
  createAdmin,
  deleteAdmin,
  getAllCategories,
  createCategory,
  renameCategory,
  deleteCategory,
} from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast } from '@/components/ToastProvider';
import type { Admin, Category } from '@/lib/types';

export default function SettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const loadAdmins = useCallback(async () => {
    setIsLoadingAdmins(true);
    try {
      setAdmins(await getAllAdmins());
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to load admins', 'error');
    } finally {
      setIsLoadingAdmins(false);
    }
  }, [showToast]);

  const loadCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      setCategories(await getAllCategories());
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to load categories', 'error');
    } finally {
      setIsLoadingCategories(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAdmins();
    loadCategories();
  }, [loadAdmins, loadCategories]);

  async function handleAddAdmin(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await createAdmin(newEmail, newPassword, newName);
      showToast('Admin account created');
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setShowAddForm(false);
      loadAdmins();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create admin');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAdmin(id: string) {
    try {
      await deleteAdmin(id);
      showToast('Admin removed');
      loadAdmins();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to remove admin', 'error');
    }
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    setCategoryFormError(null);
    setIsSubmittingCategory(true);
    try {
      await createCategory(newCategoryName, newCategoryIcon || undefined);
      showToast('Category created — the mobile app will pick it up next time it fetches categories');
      setNewCategoryName('');
      setNewCategoryIcon('');
      setShowAddCategoryForm(false);
      loadCategories();
    } catch (err) {
      setCategoryFormError(err instanceof ApiError ? err.message : 'Failed to create category');
    } finally {
      setIsSubmittingCategory(false);
    }
  }

  function startRenaming(category: Category) {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  }

  async function saveRename(id: number) {
    if (!editingCategoryName.trim()) return;
    try {
      await renameCategory(id, editingCategoryName.trim());
      showToast('Category renamed');
      setEditingCategoryId(null);
      loadCategories();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to rename category', 'error');
    }
  }

  async function handleDeleteCategory(id: number) {
    try {
      await deleteCategory(id);
      showToast('Category removed');
      loadCategories();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to remove category', 'error');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Account, admin, and category management</p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Signed in as</h2>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Admin accounts</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Everyone listed here has full access to this portal
            </p>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            {showAddForm ? 'Cancel' : '+ Add admin'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddAdmin} className="mt-4 rounded-lg bg-gray-50 p-4">
            {formError && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="text"
                required
                placeholder="Full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                type="email"
                required
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                type="password"
                required
                placeholder="Temporary password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating…' : 'Create admin account'}
            </button>
          </form>
        )}

        <div className="mt-4 divide-y divide-gray-100">
          {isLoadingAdmins ? (
            <p className="py-4 text-center text-sm text-gray-500">Loading…</p>
          ) : admins.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No admins found</p>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {admin.name}
                    {admin.id === user?.id && (
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">You</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">{admin.email}</p>
                </div>
                {admin.id !== user?.id && (
                  <ConfirmModal
                    title="Remove this admin?"
                    description={`"${admin.name}" will lose access to this portal immediately.`}
                    confirmLabel="Remove"
                    confirmStyle="danger"
                    onConfirm={() => handleDeleteAdmin(admin.id)}
                    trigger={(open) => (
                      <button
                        onClick={open}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    )}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Business categories</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Shown to business owners when listing a business, and as filter chips in the mobile app
            </p>
          </div>
          <button
            onClick={() => setShowAddCategoryForm((v) => !v)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            {showAddCategoryForm ? 'Cancel' : '+ Add category'}
          </button>
        </div>

        {showAddCategoryForm && (
          <form onSubmit={handleAddCategory} className="mt-4 rounded-lg bg-gray-50 p-4">
            {categoryFormError && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{categoryFormError}</div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                placeholder="Category name (e.g. Bakeries)"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                type="text"
                placeholder="Icon name (optional, e.g. bakery_dining_outlined)"
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Icon name must match a Flutter Material icon identifier used by the mobile app&apos;s icon lookup — leave
              blank to fall back to a default icon.
            </p>
            <button
              type="submit"
              disabled={isSubmittingCategory}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmittingCategory ? 'Creating…' : 'Create category'}
            </button>
          </form>
        )}

        <div className="mt-4 divide-y divide-gray-100">
          {isLoadingCategories ? (
            <p className="py-4 text-center text-sm text-gray-500">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No categories found</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between py-3">
                {editingCategoryId === category.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(category.id);
                        if (e.key === 'Escape') setEditingCategoryId(null);
                      }}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <button
                      onClick={() => saveRename(category.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategoryId(null)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{category.name}</p>
                      <p className="text-xs text-gray-500">
                        {category.businessCount} {category.businessCount === 1 ? 'business' : 'businesses'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startRenaming(category)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Rename
                      </button>
                      <ConfirmModal
                        title="Remove this category?"
                        description={
                          category.businessCount > 0
                            ? `${category.businessCount} ${category.businessCount === 1 ? 'business currently uses' : 'businesses currently use'} "${category.name}". They'll keep showing this category name, but it won't be offered as an option for new listings.`
                            : `"${category.name}" isn't used by any current business.`
                        }
                        confirmLabel="Remove"
                        confirmStyle="danger"
                        onConfirm={() => handleDeleteCategory(category.id)}
                        trigger={(open) => (
                          <button
                            onClick={open}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        )}
                      />
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
