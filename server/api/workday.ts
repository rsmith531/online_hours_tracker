// ~/server/api/workday.ts

import { defineEventHandler, readBody, createError } from 'h3';
import {
  createSession,
  updateSessionEnd,
  createSegment,
  updateSegmentEnd,
  getOpenSession,
  getLastClosedSession,
  getOpenSegment,
  getSegmentsForSession,
} from '../../utils/db';
import { ActivityType } from '../../composables/workdayService';
import { useIO } from '../plugins/socket';

export interface WorkdayApiResponse {
  start_time: Date | null;
  end_time: Date | null;
  segments:
    | {
        start_time: Date | null;
        end_time: Date | null;
        activity: ActivityType;
      }[]
    | undefined;
}

export default defineEventHandler(async (event) => {
  // check if request is authorized, throws 401 if not
  await requireUserSession(event);

  try {
    // get the current workday
    if (event.method === 'GET') {
      let response: WorkdayApiResponse = {
        start_time: null,
        end_time: null,
        segments: undefined,
      };
      const openSession = getOpenSession();
      if (openSession) {
        const segments = getSegmentsForSession(openSession.id);
        response = {
          start_time: openSession.start,
          end_time: openSession.end,
          segments: segments.map((segment) => {
            return {
              start_time: segment.start,
              end_time: segment.end,
              activity: segment.activity,
            };
          }),
        };
      } else {
        const lastClosedSession = getLastClosedSession();
        if (lastClosedSession) {
          const sessionSegments = getSegmentsForSession(lastClosedSession.id);
          response = {
            start_time: lastClosedSession.start,
            end_time: lastClosedSession.end,
            segments: sessionSegments.map((segment) => {
              return {
                start_time: segment.start,
                end_time: segment.end,
                activity: segment.activity,
              };
            }),
          };
        }
      }

      return response;
    }

    if (event.method === 'POST') {
      const body = await readBody(event);

      // socket.io instance
      const io = useIO();

      if (body) {
        let response: WorkdayApiResponse;
        // use provided timestamp, or the servers.
        const timestamp = body.timestamp
          ? new Date(body.timestamp)
          : new Date();
        const openSession = getOpenSession();
        switch (body.action) {
          // open or close the workday
          case 'toggle': {
            if (openSession) {
              // Close the open session
              const openSegment = getOpenSegment(openSession.id);
              if (openSegment) {
                updateSegmentEnd(openSegment.id, timestamp);
              }
              updateSessionEnd(openSession.id, timestamp);
              response = {
                start_time: openSession.start,
                end_time: timestamp,
                segments: getSegmentsForSession(openSession.id).map(
                  (segment) => {
                    return {
                      start_time: segment.start,
                      end_time: segment.end,
                      activity: segment.activity,
                    };
                  }
                ),
              };
            } else {
              // Open a new session
              const sessionId = createSession(timestamp);
              createSegment({
                session_id: sessionId,
                start: timestamp,
                end: null,
                activity: ActivityType.Working,
              });
              response = {
                start_time: timestamp,
                end_time: null,
                segments: [
                  {
                    start_time: timestamp,
                    end_time: null,
                    activity: ActivityType.Working,
                  },
                ],
              };
            }

            // send a trigger to all the clients to refetch the workday data
            io.emit('workdayUpdated', response);
            return response;
          }

          // pause or unpause the workday
          case 'pause': {
            if (openSession) {
              const openSegment = getOpenSegment(openSession.id);
              if (
                openSegment &&
                openSegment.activity === ActivityType.Working
              ) {
                // close the Working segment and open an OnBreak segment
                updateSegmentEnd(openSegment.id, timestamp);
                createSegment({
                  session_id: openSession.id,
                  start: timestamp,
                  end: null,
                  activity: ActivityType.OnBreak,
                });
              } else if (
                openSegment &&
                openSegment.activity === ActivityType.OnBreak
              ) {
                // close the OnBreak segment and open a Working segment
                updateSegmentEnd(openSegment.id, timestamp);
                createSegment({
                  session_id: openSession.id,
                  start: timestamp,
                  end: null,
                  activity: ActivityType.Working,
                });
              } else {
                return createError({
                  statusCode: 513,
                  statusMessage:
                    'An unexpected error occurred while toggling the paused state of your workday.',
                });
              }
              response = {
                start_time: openSession.start,
                end_time: openSession.end,
                segments: getSegmentsForSession(openSession.id).map(
                  (segment) => {
                    return {
                      start_time: segment.start,
                      end_time: segment.end,
                      activity: segment.activity,
                    };
                  }
                ),
              };

              // send a trigger to all the clients to refetch the workday data
              io.emit('workdayUpdated', response);
              return response;
            }
            return createError({
              statusCode: 512,
              statusMessage: 'Cannot pause without an open session',
            });
          }
          default:
            return createError({
              statusCode: 400,
              statusMessage: 'Invalid request',
            });
        }
      }
    }

    return createError({
      statusCode: 400,
      statusMessage: 'Invalid request',
    });
  } catch (error) {
    console.error('Workday API:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    });
  }
});
