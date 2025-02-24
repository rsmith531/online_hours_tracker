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
    isLoading,
  } = useQuery<WorkDay>({
    queryKey: ['workday_service'],
    queryFn: async (): Promise<WorkDay> => {
      try {
        const response = await useFetch<WorkdayApiResponse>(`${apiUrl}/workday`);
        console.log('workday service sees workday as: ', response.data.value);
        return {
          start_time: response.data.value?.start_time
            ? new Date(response.data.value.start_time)
            : null,
          end_time: response.data.value?.end_time ? new Date(response.data.value.end_time) : null,
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
        severity: startTime ? 'success' : 'error',
        summary: `${startTime ? 'Opened' : 'Closed '} workday at ${startTime ? startTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : endTime ? endTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'error'}`,
        detail: startTime ? 'Have a productive day!' : 'Enjoy your evening!',
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

  const isWorkdayOpen = computed(() => {
    return (workday.value?.start_time !== null &&
      workday.value?.end_time === null) as boolean;
  });

  const isWorkdayClosed = computed(() => {
    return (workday.value?.start_time !== null &&
      workday.value?.end_time !== null) as boolean;
  });

  const isWorkdayNull = computed(() => {
    return (workday.value?.start_time === null &&
      workday.value?.end_time === null) as boolean;
  });

  return {
    workday,
    updateWorkday,
    isLoading,
    refetch,
    isWorkdayNull,
    isWorkdayClosed,
    isWorkdayOpen,
  };
}

export interface WorkDay {
  start_time: Date | null;
  end_time: Date | null;
}
