import axios from 'axios';

export interface Prompt {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromptPayload {
  title: string;
  content: string;
  isActive?: boolean;
}

export interface UpdatePromptPayload {
  title?: string;
  content?: string;
  isActive?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Creates an axios instance pre-configured with the API base URL.
 * Pass the Clerk session JWT to attach it as a Bearer token.
 */
export function createApiClient(token?: string | null) {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// --- Prompt API calls ---

export async function getPrompts(token?: string | null): Promise<Prompt[]> {
  const client = createApiClient(token);
  const { data } = await client.get<Prompt[]>('/prompts');
  return data;
}

export async function getPrompt(id: string, token?: string | null): Promise<Prompt> {
  const client = createApiClient(token);
  const { data } = await client.get<Prompt>(`/prompts/${id}`);
  return data;
}

export async function createPrompt(
  payload: CreatePromptPayload,
  token?: string | null
): Promise<Prompt> {
  const client = createApiClient(token);
  const { data } = await client.post<Prompt>('/prompts', payload);
  return data;
}

export async function updatePrompt(
  id: string,
  payload: UpdatePromptPayload,
  token?: string | null
): Promise<Prompt> {
  const client = createApiClient(token);
  const { data } = await client.put<Prompt>(`/prompts/${id}`, payload);
  return data;
}
