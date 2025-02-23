// workdayService.ts

import { useQuery, useMutation } from '@tanstack/vue-query';

export function workdayService() {
  const toast = useToast();

  // get the public apiUrl from nuxt.config.ts
  const runtimeConfig = useRuntimeConfig();
  const apiUrl = runtimeConfig.public.apiUrl || '/api';

  const {
    data: workday,
    refetch,
    isLoading,
  } = useQuery<WorkDay, Error>({
    queryKey: ['workday'],
    queryFn: async (): Promise<WorkDay> => {
      try {
        const response = await useFetch<WorkdayResponse>(`${apiUrl}/workday`);
        if (!response.data || !response.data.value) {
          console.error(response.error);
          throw new Error(`HTTP error! status: ${response.error}`);
        }
        return {
          start_time: response.data.value.start_time
            ? new Date(response.data.value.start_time)
            : null,
          end_time: response.data.value.end_time
            ? new Date(response.data.value.end_time)
            : null,
        };
      } catch (error) {
        console.error('Error fetching workday from API', error);
        throw error;
      }
    },
    enabled: true, // TODO: figure out when to enable this
    staleTime: Number.POSITIVE_INFINITY,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });

  const { mutate: updateWorkday } = useMutation<WorkDay, Error>({
    mutationFn: async (): Promise<WorkDay> => {
      try {
        const response = await $fetch<WorkdayResponse>(`${apiUrl}/workday`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'toggle' }), // Send 'toggle' action
        });
        if (!response) {
          throw new Error(`HTTP error! status: ${response}`);
        }
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
    onSuccess: (updatedWorkdayData) => {
      refetch();
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
    },
  });

  return { workday, updateWorkday, isLoading, refetch };
}

export interface WorkDay {
  start_time: Date | null;
  end_time: Date | null;
}

interface WorkdayResponse {
  start_time: string | null;
  end_time: string | null;
}
