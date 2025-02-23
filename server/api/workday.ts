// ~/server/api/workday.ts

import { defineEventHandler, readBody } from 'h3';
import type { WorkDay } from '~/utils/workdayService';

const mockWorkdayData: WorkDay = {
  // In-memory mock data (will be reset on server restart)
  start_time: new Date(),
  end_time: null,
};

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    return mockWorkdayData;
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
      return mockWorkdayData;
    }
  }
  return { message: 'Invalid request' };
});
