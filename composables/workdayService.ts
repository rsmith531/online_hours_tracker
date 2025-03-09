// ~/composables/workdayService.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { WorkdayApiResponse } from 'server/api/workday';
import { computed } from 'vue';
import { ToastEventBus } from 'primevue';
import { useSocket } from './socket.client';

// Singleton instance
let workdayInstance: ReturnType<typeof createWorkdayService>;

// TODO: rsmith - see about making this either a singleton or a plugin if the performance gains warrant it. Right now it seems to have an instance for every time it is called throughout the app, since console logs within it print four times
function createWorkdayService() {
  const queryClient = useQueryClient();
  // socket.io client
  const socket = useSocket();

  const {
    data: workday,
    refetch,
    isPending,
    isError,
    suspense: fetchOnServer,
  } = useQuery<WorkDay>({
    queryKey: ['workday_service'],
    queryFn: async (): Promise<WorkDay> => {
      try {
        let parsedResponse: WorkDay;
        if (import.meta.server) {
          const response = await useFetch<WorkdayApiResponse>('/api/workday');
          parsedResponse = {
            start_time: response.data.value?.start_time
              ? new Date(response.data.value.start_time)
              : null,
            end_time: response.data.value?.end_time
              ? new Date(response.data.value.end_time)
              : null,
            segments: response.data.value?.segments
              ? response.data.value.segments
              : undefined,
          };
        } else {
          const response = await $fetch<WorkdayApiResponse>('/api/workday');
          parsedResponse = {
            start_time: response.start_time
              ? new Date(response.start_time)
              : null,
            end_time: response.end_time ? new Date(response.end_time) : null,
            segments: response.segments ? response.segments : undefined,
          };
        }
        return parsedResponse;
      } catch (error) {
        console.error('Error fetching workday from API: ', error);
        throw error;
      }
    },
    // refetch to make sure the stopwatch doesn't get too far out of sync
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    placeholderData: {
      start_time: null,
      end_time: null,
      segments: undefined,
    },
  });

  onMounted(() => {
    socket.on('workdayUpdated', (data: WorkDay) => {
      console.log('[workdayService] receiving updated data: ', data)
      queryClient.setQueryData(['workday_service'], data);
      // refetch();
    });
  });

  onUnmounted(() => {
    console.log('[workdayService] disconnecting from socket')
    socket.off('workdayUpdated');
    // socket.disconnect();
  });

  const { mutate: updateWorkday } = useMutation<WorkDay, Error>({
    mutationFn: async (): Promise<WorkDay> => {
      try {
        const now = new Date().toISOString();
        const response = await $fetch<WorkdayApiResponse>('/api/workday', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'toggle', timestamp: now }),
        });
        return {
          start_time: response.start_time
            ? new Date(response.start_time)
            : null,
          end_time: response.end_time ? new Date(response.end_time) : null,
          segments: response.segments,
        };
      } catch (error) {
        console.error('Failed to update workday via API', error);
        throw error;
      }
    },
    onSuccess: async (updatedWorkdayData) => {
      // https://tanstack.com/query/v5/docs/framework/vue/guides/updates-from-mutation-responses
      queryClient.setQueryData(['workday_service'], updatedWorkdayData);
      queryClient.invalidateQueries({ queryKey: ['workday_service'] });
      const startTime: Date | null = updatedWorkdayData.start_time;
      const endTime: Date | null = updatedWorkdayData.end_time;
      ToastEventBus.emit('add', {
        severity: endTime ? 'error' : 'success',
        summary: `${endTime ? 'Closed' : 'Opened'} workday at ${
          endTime
            ? endTime.toLocaleString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })
            : startTime
              ? startTime.toLocaleString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                })
              : 'error'
        }`,
        detail: endTime ? 'Enjoy your evening!' : 'Have a productive day!',
        life: 4000,
      });
    },
    onError: (error) => {
      console.error(`Failed to update workday: ${error.message}.`);
      ToastEventBus.emit('add', {
        severity: 'error',
        summary: 'Uh oh',
        detail: 'Something went wrong when trying to update the workday.',
        life: 4000,
      });
    },
  });

  const { mutate: pauseWorkday } = useMutation<WorkDay, Error>({
    mutationFn: async (): Promise<WorkDay> => {
      try {
        const now = new Date().toISOString();
        const response = await $fetch<WorkdayApiResponse>('/api/workday', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'pause', timestamp: now }),
        });
        return {
          start_time: response.start_time
            ? new Date(response.start_time)
            : null,
          end_time: response.end_time ? new Date(response.end_time) : null,
          segments: response.segments,
        };
      } catch (error) {
        console.error('Failed to pause workday via API', error);
        throw error;
      }
    },
    onSuccess: async (updatedWorkdayData) => {
      // https://tanstack.com/query/v5/docs/framework/vue/guides/updates-from-mutation-responses
      queryClient.setQueryData(['workday_service'], updatedWorkdayData);
      queryClient.invalidateQueries({ queryKey: ['workday_service'] });
      const segment = updatedWorkdayData.segments?.at(-1);
      const startTime = segment?.start_time && new Date(segment.start_time);
      const activity = segment?.activity;

      ToastEventBus.emit('add', {
        severity: activity === ActivityType.Working ? 'success' : 'warn',
        summary: `${activity === ActivityType.Working ? 'Unpaused' : 'Paused '} workday at ${startTime ? startTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'error'}`,
        detail:
          activity === ActivityType.Working
            ? 'Keep up the good work!'
            : 'Enjoy your break!',
        life: 4000,
      });
    },
    onError: async (error) => {
      console.error(`Failed to pause workday: ${error.message}.`);
      ToastEventBus.emit('add', {
        severity: 'error',
        summary: 'Uh oh',
        detail: 'Something went wrong when trying to update the workday.',
        life: 4000,
      });
    },
  });

  const isWorkdayOpen = computed(() => {
    return (workday.value?.start_time !== null &&
      workday.value?.end_time === null) as boolean;
  });

  const isWorkdayClosed = computed(() => {
    return (workday.value?.start_time !== null &&
      workday.value?.end_time !== null) as boolean;
  });

  const isWorkdayPaused = computed(() => {
    if (workday.value?.segments) {
      const lastSegment = workday.value.segments.at(-1);
      if (lastSegment) {
        // Check if lastSegment is defined
        return (lastSegment.activity !== ActivityType.Working) as boolean;
      }
    }
    return true;
  });

  const isWorkdayNull = computed(() => {
    return (workday.value?.start_time === null &&
      workday.value?.end_time === null) as boolean;
  });

  onServerPrefetch(async () => {
    await fetchOnServer();
  });

  return {
    workday,
    updateWorkday,
    pauseWorkday,
    isPending,
    isError,
    refetch,
    isWorkdayNull,
    isWorkdayClosed,
    isWorkdayOpen,
    isWorkdayPaused,
  };
}

export function useWorkday() {
  if (!workdayInstance) {
    workdayInstance = createWorkdayService();
  }
  return workdayInstance;
}

export interface WorkDay {
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

export enum ActivityType {
  Working = 'working',
  OnBreak = 'on break',
}
