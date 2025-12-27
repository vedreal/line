import { z } from 'zod';
import { insertUserSchema, users, checkEligibilitySchema, submitEmailSchema, checkInSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: checkEligibilitySchema,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  user: {
    get: {
      method: 'GET' as const,
      path: '/api/user/:telegramId',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    checkIn: {
      method: 'POST' as const,
      path: '/api/user/check-in',
      input: checkInSchema,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden, // If already checked in
      },
    },
    submitEmail: {
      method: 'POST' as const,
      path: '/api/user/email',
      input: submitEmailSchema,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  referrals: {
    list: {
      method: 'GET' as const,
      path: '/api/referrals/:telegramId',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
