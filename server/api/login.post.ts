// ~/server/api/login.post.ts

import { z } from 'zod';

const bodySchema = z.object({
  email: z.string(),
  password: z.string().min(8),
});

// https://nuxt.com/docs/guide/recipes/sessions-and-authentication#login-api-route
export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse);
  const config = useRuntimeConfig();
  if (email === config.loginUsername && password === config.loginPassword) {
    // set the user session in the cookie
    // this server util is auto-imported by the auth-utils module
    await setUserSession(
      event,
      {
        user: {
          name: config.public.loginName,
        },
      },
      { maxAge: 60 * 60 * 24 * 7 } // 1 week
    );
    return {};
  }
  throw createError({
    statusCode: 401,
    message: 'Bad credentials',
  });
});
