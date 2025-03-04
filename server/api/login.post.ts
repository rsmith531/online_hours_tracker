// ~/server/api/login.post.ts

import { z } from 'zod';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// https://nuxt.com/docs/guide/recipes/sessions-and-authentication#login-api-route
export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, bodySchema.parse);

  if (
    email === process.env.LOGIN_USERNAME &&
    password === process.env.LOGIN_PASSWORD
  ) {
    // set the user session in the cookie
    // this server util is auto-imported by the auth-utils module
    await setUserSession(
      event,
      {
        user: {
          name: process.env.LOGIN_NAME,
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
