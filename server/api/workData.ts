// ~/server/api/workday.ts

import { defineEventHandler, readBody, createError, type H3Error } from 'h3';
import {
  countSessions,
  deleteSessions,
  getSessions,
  setSessionEnd,
  setSessionStart,
} from '../../utils/db/queries/workday';
import { z, ZodError } from 'zod';

const getSchema = z
  .object({
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
    filterBy: z.enum(['state', 'start', 'start_time', 'end_time']).optional(),
    filterValues: z
      .preprocess(
        // Preprocessing function to attempt parsing strings that look like JSON arrays
        (val) => {
          if (typeof val === 'string') {
            try {
              // Attempt to parse the string as JSON.
              // This will correctly parse "[\"date\",\"date\"]" into an array.
              // If the string is "open" or "closed", JSON.parse will likely fail or return the string itself,
              // which the union validation will handle next.
              const parsed = JSON.parse(val);
              // Only return parsed if it resulted in an array or primitive (string/number/boolean/null)
              // to avoid accidentally turning non-JSON strings into weird objects/values.
              // For this specific case, parsing "open" should fail, returning val.
              // Parsing "[\"date\", \"date\"]" should succeed, returning the array.
              // A more robust check might be needed for complex cases, but for "[]" or string primitives, this is often okay.
              // Let's refine this: If parsing a string *results* in an array, return the array. Otherwise, return the original value.
              if (Array.isArray(parsed)) {
                return parsed;
              }
              // If parsing didn't result in an array (e.g., it was a string like "open" or invalid JSON),
              // return the original value so the union can try matching the enum.
              return val;
            } catch (e) {
              // If JSON.parse throws an error (e.g., invalid JSON string),
              // return the original value. The union will then try to match it (likely failing).
              return val;
            }
          }
          // If the input isn't a string (e.g., already an array from a different source),
          // return it as is.
          return val;
        },
        // The union schema remains the same, but it now receives potentially transformed data
        z.union([
          z.enum(['open', 'closed']),
          z.tuple([z.coerce.date().nullable(), z.coerce.date().nullable()]),
        ])
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    const { filterBy, filterValues } = data;
    if (filterBy && !filterValues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'filterValues is required when filterBy is specified.',
        path: ['filterValues'], // Associate the error with the filterValues field
      });
      return;
    }
    if (!filterBy && filterValues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'filterBy is required when filterValues is specified.',
        path: ['filterBy'], // Associate the error with the filterValues field
      });
      return;
    }
    if (filterBy === 'state' && typeof filterValues !== 'string') {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: 'string',
        received: typeof filterValues,
        message: `filterValues must be a string when filterBy is ${filterBy}.`,
        path: ['filterValues'],
      });
      return;
    }
    // TODO: add check for tuple when filterBy is not 'state'
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
  ({
    id: number;
    state: string | null;
    start: string; // as ISO string
    end: string | null; // as ISO string
  } & {
    segments: {
      id: number;
      start: string; // as ISO string
      end: string | null; // as ISO string
      sessionId: number;
      activity: 'working' | 'on break';
    }[];
  })[],
  Awaited<ReturnType<typeof countSessions>>,
];

export default defineEventHandler(
  async (event): Promise<workDataApiResponse | null | H3Error> => {
    // check if request is authorized, throws 401 if not
    await requireUserSession(event);

    console.log(`[api/WorkData] got ${event.method} request at ${event.path}`);

    try {
      switch (event.method) {
        case 'GET': {
          let response: workDataApiResponse | null = null;
          const {
            sortby,
            order,
            amount,
            page,
            timezoneOffset,
            filterBy,
            filterValues,
          } = await getValidatedQuery(event, getSchema.parse);

          console.log(`[api/workData ${event.method}] validated filter values: `, filterValues)

          const sessionsResponse = await getSessions(
            { column: sortby, order: order },
            amount,
            page,
            timezoneOffset,
            filterBy &&
              filterValues && {
                column: filterBy,
                value: filterValues,
              }
          );
          const totalSessions = await countSessions();
          // @ts-expect-error when the Dates are turned into a response and sent across the wires, they'll be converted to ISO strings, as the type is asking for
          response = [sessionsResponse, totalSessions];
          return response;
        }
        case 'POST': {
          const { column, rowId, newValue } = await readValidatedBody(
            event,
            postSchema.parse
          );

          console.log(
            `[editSession] changing value in column ${column} for row ${rowId} to "${newValue}".`
          );

          switch (column) {
            case 'start': {
              const validator = z.coerce.number().min(1577836800); // 1/1/2020 00:00:00
              const validatedResponse = validator.parse(newValue);
              const valueToSubmit = new Date(validatedResponse);

              await setSessionStart(rowId, valueToSubmit);
              break;
            }

            case 'end': {
              const validator = z.coerce.number().min(1577836800).nullable(); // 1/1/2020 00:00:00
              const validatedResponse = validator.parse(newValue);

              // try to make a Date object out of newValue if it isn't null
              const valueToSubmit = validatedResponse
                ? new Date(validatedResponse)
                : null;
              await setSessionEnd(rowId, valueToSubmit);
              break;
            }

            case 'state': {
              const validator = z.enum(['open', 'closed']);
              validator.parse(newValue);
              const validatedResponse = validator.parse(newValue);

              switch (validatedResponse) {
                case 'open': {
                  await setSessionEnd(rowId, null);
                  break;
                }
                case 'closed': {
                  await setSessionEnd(rowId, new Date());
                  break;
                }
                default: {
                  throw new Error(
                    `[editSession] ${newValue} is an invalid value for updating ${column}.`
                  );
                }
              }
              break;
            }
            default: {
              throw new Error(`[editSession] column ${column} does not exist`);
            }
          }

          return null;
        }
        case 'DELETE': {
          const body = await readValidatedBody(event, deleteSchema.parse);

          await deleteSessions(body.ids);

          return null;
        }
        default: {
          return createError({
            statusCode: 405,
            statusMessage: 'Method not allowed',
          });
        }
      }
    } catch (error) {
      console.error('WorkData API:', error);
      if (error instanceof ZodError) {
        return createError({
          statusCode: 400,
          statusMessage: 'Invalid request',
        });
      }
      return createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error',
      });
    }
  }
);
