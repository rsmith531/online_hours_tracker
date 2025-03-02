// ~/utils/workdayService.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { WorkdayApiResponse } from 'server/api/workday';
import { computed } from 'vue';

export function workdayService() {
  const toast = useToast();
  const queryClient = useQueryClient();

  // get the public apiUrl from nuxt.config.ts
  const runtimeConfig = useRuntimeConfig();
  const apiUrl = runtimeConfig.public.apiUrl || '/api';

  const {
    data: workday,
    refetch,
    isPending,
    isError,
  } = useQuery<WorkDay>({
    // TODO: prevent access on workday until it has gotten a response from the API
    queryKey: ['workday_service'],
    queryFn: async (): Promise<WorkDay> => {
      try {
        const response = await useFetch<WorkdayApiResponse>(
          `${apiUrl}/workday`
        );
        return {
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
      } catch (error) {
        console.error('Error fetching workday from API: ', error);
        throw error;
      }
    },
    // TODO: figure out when to enable this
    enabled: true,
    // no need to go stale, since the only place data is updated is here
    staleTime: Number.POSITIVE_INFINITY,
    // refetch to make sure the stopwatch doesn't get too far out of sync
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    placeholderData: {
      start_time: null,
      end_time: null,
      segments: undefined,
    },
  });

  const { mutate: updateWorkday } = useMutation<WorkDay, Error>({
    mutationFn: async (): Promise<WorkDay> => {
      try {
        const now = new Date().toISOString();
        const response = await $fetch<WorkdayApiResponse>(`${apiUrl}/workday`, {
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
      queryClient.invalidateQueries({ queryKey: ['workday_service'] });
      const startTime: Date | null = updatedWorkdayData.start_time;
      const endTime: Date | null = updatedWorkdayData.end_time;
      toast.add({
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
      toast.add({
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
        const response = await $fetch<WorkdayApiResponse>(`${apiUrl}/workday`, {
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
      queryClient.invalidateQueries({ queryKey: ['workday_service'] });
      const segment = updatedWorkdayData.segments?.at(-1);
      const startTime = segment?.start_time && new Date(segment.start_time);
      const activity = segment?.activity;
      toast.add({
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
      toast.add({
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
