// ~/middleware/01.log.global.ts
import path from 'node:path';

// TODO: add rolling log file functionality so the disk doesn't fill up
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.client) return;
  console.log('[middleware/requestLog] running logging middleware');

  // Dynamically import node modules after the client-side check is complete
  const fs = await import('node:fs');
  const { writeFileSync, existsSync, mkdirSync, readFileSync } = fs;

  const url = await import('node:url');
  const { fileURLToPath } = url;

  const logsDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../logs'
  );
  const logFilePath = path.join(logsDirectory, 'requests.json');

  console.log(
    `[middleware/requestLog] saving request log file to ${logFilePath}`
  );

  // Ensure the logs directory exists
  if (!existsSync(logsDirectory)) {
    mkdirSync(logsDirectory, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const clientIP =
    useRequestHeaders()['x-forwarded-for'] ||
    useRequestHeaders()['cf-connecting-ip'] ||
    useRequestHeaders()['remote-addr'] ||
    'unknown';
  const userAgent = useRequestHeaders()['user-agent'] || 'unknown';
  const requestMethod = useRequestHeaders().method;
  const clientUrl = useRequestURL();

  const logEntry = {
    timestamp,
    clientIP,
    userAgent,
    method: requestMethod,
    path: to.fullPath,
    referrer: useRequestHeaders().referer || '',
    isLikelyBot: false,
    query: Object.fromEntries(clientUrl.searchParams.entries()),
  };

  // Simple bot detection based on common bot user-agent patterns
  const isLikelyBot = /bot|crawler|spider|headless|puppeteer/i.test(userAgent);
  logEntry.isLikelyBot = isLikelyBot;

  try {
    let existingLogs = [];
    if (existsSync(logFilePath)) {
      const fileContent = readFileSync(logFilePath, 'utf-8');
      try {
        existingLogs = JSON.parse(fileContent);
      } catch (error) {
        console.error(
          '[middleware/requestLog] Error parsing existing logs:',
          error
        );
        // If parsing fails, start with a new array
        existingLogs = [];
      }
    }

    existingLogs.push(logEntry);
    writeFileSync(
      logFilePath,
      `${JSON.stringify(existingLogs, null, 2)}\n`,
      'utf-8'
    );
  } catch (error) {
    console.error('[middleware/requestLog] Error writing to log file:', error);
  }
});
