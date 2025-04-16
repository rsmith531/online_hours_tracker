// ~/server/api/workday.ts

import { defineEventHandler, readBody, createError, type H3Error } from 'h3';
import { countSessions, getSessions } from '../../utils/db/queries/workday';
import { z } from 'zod';

const bodySchema = z.object({
  // derived from the relevant columns of the sessions table
  sortby: z.enum(['id', 'state', 'start', 'start_time', 'end_time']),
  order: z.enum(['asc', 'desc']),
  amount: z.coerce.number().min(1),
  page: z.coerce.number().min(1),
  // maximum offset in hours * 60 minutes
  timezoneOffset: z.coerce
    .number()
    .min(-14 * 60)
    .max(14 * 60),
});

export type workDataApiResponse = [
  Awaited<ReturnType<typeof getSessions>>,
  Awaited<ReturnType<typeof countSessions>>,
];

export default defineEventHandler(
  async (event): Promise<workDataApiResponse | null | H3Error> => {
    // check if request is authorized, throws 401 if not
    // TODO: figure out why user session doesn't refresh when I reload the /portal page
    await requireUserSession(event);

    console.log(`[api/WorkData] got ${event.method} request at ${event.path}`);

    try {
      if (event.method === 'GET') {
        const { sortby, order, amount, page, timezoneOffset } =
          await getValidatedQuery(event, bodySchema.parse);

        let response: workDataApiResponse | null = null;

        const sessionsResponse = await getSessions(
          { column: sortby, order: order },
          amount,
          page,
          timezoneOffset
        );
        const totalSessions = await countSessions();
        response = [sessionsResponse, totalSessions];
        return response;
      }

      if (event.method === 'POST') {
        const body = await readBody(event);

        if (body) {
          const response: workDataApiResponse | null = null;
          console.warn('[api/WorkData/POST] not implemented');
        }
      }

      return createError({
        statusCode: 400,
        statusMessage: 'Invalid request',
      });
    } catch (error) {
      console.error('WorkData API:', error);
      return createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
      });
    }
  }
);
