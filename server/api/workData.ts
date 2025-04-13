// ~/server/api/workday.ts

import { defineEventHandler, readBody, createError, type H3Error } from 'h3';
import type { WorkdayApiResponse } from './workday';


export default defineEventHandler(
  async (event): Promise<WorkdayApiResponse[] | null | H3Error> => {
    // check if request is authorized, throws 401 if not
    await requireUserSession(event);

    console.log(`[api/WorkData] got request at ${event.path}`);

    try {
      // get the current workday
      if (event.method === 'GET') {
        const response: WorkdayApiResponse[] | null = null;

        return response;
      }

      if (event.method === 'POST') {
        const body = await readBody(event);

        if (body) {
          const response: WorkdayApiResponse[] | null = null;
          console.warn('[api/WorkData/POST] not implemented')
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
