// ~/server/api/workday.ts

import { defineEventHandler, readBody, createError } from 'h3';
import {
  createSession,
  updateSessionEnd,
  createSegment,
  updateSegmentEnd,
  getOpenSession,
  getOpenSegment,
  ActivityType,
} from '../utils/db';

export interface WorkdayApiResponse {
  start_time: Date | null;
  end_time: Date | null;
}

export default defineEventHandler(async (event) => {
  try {
    // get the current workday
    if (event.method === 'GET') {
      const openSession = getOpenSession();
      const response: {
        start_time: Date | null;
        end_time: Date | null;
      } = openSession
      ? { start_time: openSession.start, end_time: openSession.end }
      : { start_time: null, end_time: null };
      console.log('workday API is sending: ', response);
      return response;
    }

    // open or close the workday
    if (event.method === 'POST') {
      const body = await readBody(event);
      if (body && body.action === 'toggle') {
        const timestamp = body.timestamp
          ? new Date(body.timestamp)
          : new Date(); // use provided timestamp, or the servers.

        const openSession = getOpenSession();

        if (openSession) {
          // Close the open session
          const openSegment = getOpenSegment(openSession.id);
          if (openSegment) {
            updateSegmentEnd(openSegment.id, timestamp);
          }
          updateSessionEnd(openSession.id, timestamp);
          console.log('workday API is sending end_time: ', timestamp);
          return { start_time: null, end_time: timestamp };
        }

        // else: Open a new session
        const sessionId = createSession(timestamp);
        createSegment({
          session_id: sessionId,
          start: timestamp,
          end: null,
          activity: ActivityType.Working,
        });
        console.log('workday API is sending start_time: ', timestamp);
        return {start_time: timestamp, end_time: null };
      }
    }

    return createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    });
  } catch (error) {
    console.error('Error in workday API:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    });
  }
});
