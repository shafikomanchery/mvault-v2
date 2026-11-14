import { z } from 'zod';

export const AccountTypeSchema = z.enum(['website', 'bank', 'email', 'subscription', 'other']);
export const CriticalitySchema = z.enum(['High', 'Medium', 'Low']);

export const HistoryEntrySchema = z.object({
  timestamp: z.string(),
  field: z.string(),
  oldValue: z.string().optional(),
  newValue: z.string(),
});

export const LoginSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  username: z.string(),
  password: z.string().optional(),
  url: z.string().optional(),
  accountType: AccountTypeSchema,
  criticality: CriticalitySchema,
  tags: z.array(z.string()).optional(),
  expiryDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  history: z.array(HistoryEntrySchema),
});

export type Login = z.infer<typeof LoginSchema>;

export function createLogin(
  input: Omit<Login, 'id' | 'createdAt' | 'updatedAt' | 'history'> & { id?: string },
  now: Date
): Login {
  const id = input.id ?? crypto.randomUUID();
  const ts = now.toISOString();
  return LoginSchema.parse({
    ...input,
    id,
    createdAt: ts,
    updatedAt: ts,
    history: [],
  });
}
