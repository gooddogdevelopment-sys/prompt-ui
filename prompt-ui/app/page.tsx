'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  type Prompt,
  type CreatePromptPayload,
  type UpdatePromptPayload,
  getPrompts,
  createPrompt,
  updatePrompt,
} from '../lib/api';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PromptCard({
  prompt,
  onEdit,
}: {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
}) {
  const [showResponse, setShowResponse] = useState(false);
  const hasResponseObject =
    prompt.responseObject &&
    typeof prompt.responseObject === 'object' &&
    Object.keys(prompt.responseObject).length > 0;

  return (
    <div className="group relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {prompt.title}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                prompt.isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {prompt.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {prompt.content}
          </pre>

          {hasResponseObject && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowResponse((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              >
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${showResponse ? 'rotate-90' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
                {showResponse ? 'Hide' : 'Show'} response object
              </button>
              {showResponse && (
                <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-zinc-50 p-3 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {JSON.stringify(prompt.responseObject, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => onEdit(prompt)}
          className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

interface PromptFormProps {
  initial?: Prompt | null;
  onSubmit: (values: CreatePromptPayload | UpdatePromptPayload) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

function PromptForm({ initial, onSubmit, onCancel, loading }: PromptFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [responseObjectRaw, setResponseObjectRaw] = useState(
    initial?.responseObject ? JSON.stringify(initial.responseObject, null, 2) : ''
  );
  const [responseObjectError, setResponseObjectError] = useState<string | null>(null);

  const isEdit = !!initial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let responseObject: object = {};
    if (responseObjectRaw.trim()) {
      try {
        responseObject = JSON.parse(responseObjectRaw);
        if (typeof responseObject !== 'object' || Array.isArray(responseObject) || responseObject === null) {
          setResponseObjectError('Must be a JSON object (e.g. { "key": "value" })');
          return;
        }
      } catch {
        setResponseObjectError('Invalid JSON — please check your syntax.');
        return;
      }
    }
    setResponseObjectError(null);
    await onSubmit({ title, content, isActive, responseObject });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {isEdit ? 'Edit Prompt' : 'New Prompt'}
      </h2>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title *</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Summarise article"
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-violet-900"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Prompt content *</span>
        <textarea
          required
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="You are a helpful assistant…"
          className="resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-violet-900"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Response object <span className="font-normal text-zinc-400">(JSON)</span>
        </span>
        <textarea
          rows={5}
          value={responseObjectRaw}
          onChange={(e) => {
            setResponseObjectRaw(e.target.value);
            setResponseObjectError(null);
          }}
          placeholder={'{\n  "key": "value"\n}'}
          className={`resize-y rounded-lg border bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 ${
            responseObjectError
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900'
              : 'border-zinc-200 focus:border-violet-500 focus:ring-violet-200 dark:border-zinc-600 dark:focus:ring-violet-900'
          }`}
        />
        {responseObjectError && (
          <p className="text-xs text-red-500">{responseObjectError}</p>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <div
            className={`h-5 w-9 rounded-full transition ${
              isActive ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-600'
            }`}
          />
          <div
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              isActive ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </div>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Active</span>
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-violet-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create prompt'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const { getToken, isSignedIn } = useAuth();

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch prompts whenever the user signs in
  useEffect(() => {
    if (!isSignedIn) return;

    const load = async () => {
      setFetchState('loading');
      setFetchError(null);
      try {
        const token = await getToken();
        const data = await getPrompts(token);
        setPrompts(data);
        setFetchState('idle');
      } catch (err: unknown) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load prompts.');
        setFetchState('error');
      }
    };

    load();
  }, [isSignedIn, getToken]);

  const handleCreate = async (values: CreatePromptPayload | UpdatePromptPayload) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const token = await getToken();
      const created = await createPrompt(values as CreatePromptPayload, token);
      setPrompts((prev) => [created, ...prev]);
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create prompt.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (values: CreatePromptPayload | UpdatePromptPayload) => {
    if (!editingPrompt) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const token = await getToken();
      const updated = await updatePrompt(editingPrompt.id, values as UpdatePromptPayload, token);
      setPrompts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingPrompt(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to update prompt.');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditForm = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setShowForm(false);
    setFormError(null);
  };

  const openNewForm = () => {
    setEditingPrompt(null);
    setShowForm(true);
    setFormError(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingPrompt(null);
    setFormError(null);
  };

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
        <p className="text-base">Sign in to manage your prompts.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      {/* Header row */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Prompts
        </h1>
        {!showForm && !editingPrompt && (
          <button
            onClick={openNewForm}
            className="rounded-full bg-violet-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
          >
            + New prompt
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6">
          <PromptForm
            onSubmit={handleCreate}
            onCancel={cancelForm}
            loading={formLoading}
          />
          {formError && (
            <p className="mt-2 text-sm text-red-500">{formError}</p>
          )}
        </div>
      )}

      {/* Edit form */}
      {editingPrompt && (
        <div className="mb-6">
          <PromptForm
            initial={editingPrompt}
            onSubmit={handleUpdate}
            onCancel={cancelForm}
            loading={formLoading}
          />
          {formError && (
            <p className="mt-2 text-sm text-red-500">{formError}</p>
          )}
        </div>
      )}

      {/* Prompt list */}
      {fetchState === 'loading' && (
        <p className="text-sm text-zinc-500">Loading prompts…</p>
      )}

      {fetchState === 'error' && (
        <p className="text-sm text-red-500">{fetchError}</p>
      )}

      {fetchState === 'idle' && prompts.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 py-16 text-zinc-400 dark:border-zinc-700">
          <p className="text-sm">No prompts yet.</p>
          <button
            onClick={openNewForm}
            className="text-sm font-medium text-violet-600 hover:underline"
          >
            Create your first prompt →
          </button>
        </div>
      )}

      {prompts.length > 0 && (
        <div className="flex flex-col gap-4">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} onEdit={openEditForm} />
          ))}
        </div>
      )}
    </main>
  );
}
