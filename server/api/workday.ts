// ~/server/api/workday.ts

import { defineEventHandler, readBody, createError, type H3Error } from 'h3';
import {
  createSession,
  updateSessionEnd,
  createSegment,
  updateSegmentEnd,
  getOpenSession,
  getLastClosedSession,
  getOpenSegment,
  getSegmentsForSession,
} from '../../utils/db/queries/workday';
import { ActivityType } from '../../composables/workdayService';
import { getIO } from '../plugins/socket';

export interface WorkdayApiResponse {
  start_time: Date;
  end_time: Date | null;
  segments:
    | {
        start_time: Date;
        end_time: Date | null;
        activity: ActivityType;
      }[]
    | undefined;
}

export default defineEventHandler(
  async (event): Promise<WorkdayApiResponse | null | H3Error> => {
    // check if request is authorized, throws 401 if not
    await requireUserSession(event);

    console.log(`[api/workday] got request at ${event.path}`);

    try {
      // get the current workday
      if (event.method === 'GET') {
        let response: WorkdayApiResponse | null = null;
        const openSession = await getOpenSession();
        if (openSession) {
          const segments = await getSegmentsForSession(openSession.id);
          response = {
            start_time: openSession.start,
            end_time: openSession.end,
            segments: segments.map((segment) => {
              return {
                start_time: segment.start,
                end_time: segment.end,
                activity: segment.activity as ActivityType,
              };
            }),
          };
        } else {
          const lastClosedSession = await getLastClosedSession();
          if (lastClosedSession) {
            const sessionSegments = await getSegmentsForSession(lastClosedSession.id);
            response = {
              start_time: lastClosedSession.start,
              end_time: lastClosedSession.end,
              segments: sessionSegments.map((segment) => {
                return {
                  start_time: segment.start,
                  end_time: segment.end,
                  activity: segment.activity as ActivityType,
                };
              }),
            };
          }
        }

        return response;
      }

      if (event.method === 'POST') {
        const body = await readBody(event);
        const io = getIO();
        const runtime = useRuntimeConfig();
        console.log(
          `[api/workday] socket listeners at namespace ${runtime.public.socketNamespace}: `,
          (await io.fetchSockets()).map((socket) => {
            return socket.id;
          })
        );

        if (body) {
          let response: WorkdayApiResponse | null = null;
          // use provided timestamp, or the servers.
          const timestamp = body.timestamp
            ? new Date(body.timestamp)
            : new Date();
          const openSession = await getOpenSession();
          switch (body.action) {
            // open or close the workday
            case 'toggle': {
              if (openSession) {
                // Close the open session
                const openSegment = await getOpenSegment(openSession.id);
                if (openSegment) {
                  await updateSegmentEnd(openSegment.id, timestamp);
                }
                await updateSessionEnd(openSession.id, timestamp);
                response = {
                  start_time: openSession.start,
                  end_time: timestamp,
                  segments: (await getSegmentsForSession(openSession.id)).map(
                    (segment) => {
                      return {
                        start_time: segment.start,
                        end_time: segment.end,
                        activity: segment.activity as ActivityType,
                      };
                    }
                  ),
                };
              } else {
                // Open a new session
                const sessionId = await createSession(timestamp);
                await createSegment({
                  sessionId: sessionId,
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

                // TODO: update the subscribers' target notification times to the new workday
              }

              io.emit('workdayUpdate', response);

              return response;
            }

            // pause or unpause the workday
            case 'pause': {
              if (openSession) {
                console.log(openSession)
                const openSegment = await getOpenSegment(openSession.id);
                console.log(openSegment)
                if (
                  openSegment &&
                  openSegment.activity === ActivityType.Working
                ) {
                  // close the Working segment and open an OnBreak segment
                  await updateSegmentEnd(openSegment.id, timestamp);
                  await createSegment({
                    sessionId: openSession.id,
                    start: timestamp,
                    end: null,
                    activity: ActivityType.OnBreak,
                  });
                } else if (
                  openSegment &&
                  openSegment.activity === ActivityType.OnBreak
                ) {
                  // close the OnBreak segment and open a Working segment
                  await updateSegmentEnd(openSegment.id, timestamp);
                  await createSegment({
                    sessionId: openSession.id,
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
                  segments: (await getSegmentsForSession(openSession.id)).map(
                    (segment) => {
                      return {
                        start_time: segment.start,
                        end_time: segment.end,
                        activity: segment.activity as ActivityType,
                      };
                    }
                  ),
                };

                io.emit('workdayUpdate', response);

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
  }
);
