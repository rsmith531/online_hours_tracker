// ~/server/api/workday.ts

import { defineEventHandler, readBody, createError, type H3Error } from 'h3';
import {
  countSessions,
  deleteSessions,
  editSession,
  getSessions,
} from '../../utils/db/queries/workday';
import { z } from 'zod';

const getSchema = z.object({
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

const postSchema = z.object({
    // derived from the relevant columns of the sessions table
    column: z.enum(['state', 'start', 'end']),
    rowId: z.coerce.number().min(1),
    newValue: z.any(),
  });

const deleteSchema = z.object({
  ids: z.array(z.coerce.number().positive()),
});

export type workDataApiResponse = [
  Awaited<ReturnType<typeof getSessions>>,
  Awaited<ReturnType<typeof countSessions>>,
];

export default defineEventHandler(
  async (event): Promise<workDataApiResponse | null | H3Error> => {
    // check if request is authorized, throws 401 if not
    await requireUserSession(event);

    console.log(`[api/WorkData] got ${event.method} request at ${event.path}`);

    try {
      if (event.method === 'GET') {
        const { sortby, order, amount, page, timezoneOffset } =
          await getValidatedQuery(event, getSchema.parse);

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
        const body = await readValidatedBody(event, postSchema.parse);

        if (body) {
          let response: workDataApiResponse | null = null;

        //   response = 
          await editSession(body.column, body.rowId, body.newValue);

          return response;
        }
      }

      if (event.method === 'DELETE') {
        const body = await readValidatedBody(event, deleteSchema.parse);

        if (body) {
          const response: workDataApiResponse | null = null;

          await deleteSessions(body.ids);

          return response;
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
