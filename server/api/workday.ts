// ~/server/api/workday.ts
import { defineEventHandler, readBody } from 'h3';

const mockWorkdayData: { start_time: Date | null; end_time: Date | null } = {
  // In-memory mock data (will be reset on server restart)
  start_time: new Date(),
  end_time: null,
};

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    return mockWorkdayData; // Return current mock data for GET requests
  }
  if (event.method === 'POST') {
    const body = await readBody(event);
    if (body && body.action === 'toggle') {
      if (mockWorkdayData.start_time) {
        mockWorkdayData.start_time = null;
        mockWorkdayData.end_time = new Date();
      } else {
        mockWorkdayData.start_time = new Date();
        mockWorkdayData.end_time = null;
      }
      return mockWorkdayData; // Return updated mock data after POST
    }
  }
  return { message: 'Invalid request' };
});
