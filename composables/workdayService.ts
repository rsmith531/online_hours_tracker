// ~/composables/workdayService.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { WorkdayApiResponse } from 'server/api/workday';
import { computed } from 'vue';
import { ToastEventBus } from 'primevue';
import { useSocket } from './socket.client';
import { H3Error } from 'h3';

// Singleton instance
let workdayInstance: ReturnType<typeof createWorkdayService>;

function createWorkdayService() {
  const queryClient = useQueryClient();

  // logged in status of user
  const { loggedIn } = useUserSession();
  console.log(
    `[workdayService] service instantiated when user was logged ${loggedIn.value === true ? 'in' : 'out'}.`
  );

  // Refetch the data when the user logs in so that the page will have a fresh copy to render with
  watch(
    () => loggedIn.value,
    (newValue) => {
      if (newValue === true) {
        console.log(
          '[workdayService] loggedIn changed to true, refetching data.'
        );
        refetch();
      }
    }
  );

  const {
    data: workday,
    refetch,
    isPending,
    isError,
    suspense: fetchOnServer,
  } = useQuery<WorkDay | null>({
    queryKey: ['workday_service'],
    queryFn: async (): Promise<WorkDay | null> => {
      try {
        let parsedResponse: WorkDay | null = null;
        // useFetch() on server for auth session
        if (import.meta.server) {
          console.log('[workdayService] running queryFn on server');

          const response = await useFetch<WorkdayApiResponse | null | H3Error>(
            '/api/workday'
          );

          if (response.data.value instanceof H3Error) {
            console.error(
              '[workdayService] error while fetching workday from server: ',
              response.data.value
            );
            throw new Error(response.data.value.message);
          }

          if (response.data.value) {
            // parse ISO strings into Date objects
            parsedResponse = {
              start_time: new Date(response.data.value.start_time),
              end_time: response.data.value.end_time
                ? new Date(response.data.value.end_time)
                : null,
              segments: response.data.value.segments
                ? response.data.value.segments.map((segment) => {
                    return {
                      start_time: new Date(segment.start_time),
                      end_time: segment.end_time
                        ? new Date(segment.end_time)
                        : null,
                      activity: segment.activity,
                    };
                  })
                : null,
            };
          }

          // $fetch() on client for auth session
        } else {
          console.log('[workdayService] running queryFn on client');

          const response = await $fetch<WorkdayApiResponse | null | H3Error>(
            '/api/workday'
          );

          if (response instanceof H3Error) {
            console.error(
              '[workdayService] error while fetching workday from server: ',
              response
            );
            throw new Error(response.message);
          }

          if (response) {
            // parse ISO strings into Date objects
            parsedResponse = {
              start_time: new Date(response.start_time),
              end_time: response.end_time ? new Date(response.end_time) : null,
              segments: response.segments
                ? response.segments.map((segment) => {
                    return {
                      start_time: new Date(segment.start_time),
                      end_time: segment.end_time
                        ? new Date(segment.end_time)
                        : null,
                      activity: segment.activity,
                    };
                  })
                : null,
            };
          }
        }

        return parsedResponse;
      } catch (error) {
        console.error('Error fetching workday from API: ', error);
        throw error;
      }
    },
    // refetch to make sure the stopwatch doesn't get too far out of sync
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    placeholderData: null,
  });

  // const { data: masterData } = useQuery<WorkDay[] | null>({
  //   queryKey: ['master_work_data'],
  //   queryFn: async (): Promise<WorkDay[] | null> => {
  //     try {
  //       let parsedResponse: WorkDay[] | null = null;
  //       if (import.meta.server) {
  //         const response = await useFetch<WorkdayApiResponse | null | H3Error>(
  //           '/api/workday'
  //         );

  //         if (response.data.value instanceof H3Error) {
  //           console.error(
  //             '[workdayService] error while fetching workday from server: ',
  //             response.data.value
  //           );
  //           throw new Error(response.data.value.message);
  //         }
  //         if (response.data.value) {
  //         }
  //       } else if (import.meta.client) {
  //         const response = await $fetch<WorkdayApiResponse | null | H3Error>(
  //           '/api/workday'
  //         );

  //         if (response instanceof H3Error) {
  //           console.error(
  //             '[workdayService] error while fetching workday from server: ',
  //             response
  //           );
  //           throw new Error(response.message);
  //         }
  //       } else {
  //         throw new Error('unexpected vue-query state');
  //       }

  //       return parsedResponse;
  //     } catch (error) {
  //       console.error('Error fetching workday from API: ', error);
  //       throw error;
  //     }
  //   },
  // });

  // mutation that stops and starts the workday
  const { mutate: updateWorkday } = useMutation<WorkDay, Error>({
    mutationFn: async (): Promise<WorkDay> => {
      try {
        console.log('[workdayService] updateWorkday mutation running');

        // get one singular now to use for the following operations
        const now = new Date().toISOString();

        const response = await $fetch<WorkdayApiResponse>('/api/workday', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'toggle', timestamp: now }),
        });

        if (response instanceof H3Error) {
          console.error(
            '[workdayService] error while mutating workday: ',
            response
          );
          throw new Error(response.message);
        }

        return {
          // parse ISO strings into Date objects
          start_time: new Date(response.start_time),
          end_time: response.end_time ? new Date(response.end_time) : null,
          segments: response.segments
            ? response.segments.map((segment) => {
                return {
                  start_time: new Date(segment.start_time),
                  end_time: segment.end_time
                    ? new Date(segment.end_time)
                    : null,
                  activity: segment.activity,
                };
              })
            : null,
        };
      } catch (error) {
        console.error('Failed to update workday via API', error);
        throw error;
      }
    },
    onSuccess: async (updatedWorkdayData) => {
      console.log(
        '[workdayService] updateWorkday successful, got: ',
        updatedWorkdayData
      );
      // https://tanstack.com/query/v5/docs/framework/vue/guides/updates-from-mutation-responses
      queryClient.setQueryData(['workday_service'], updatedWorkdayData);

      const startTime: Date | null = updatedWorkdayData.start_time;
      const endTime: Date | null = updatedWorkdayData.end_time;

      // advise the user of the successful update
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
      // for the devs
      console.error(`Failed to update workday: ${error.message}.`);

      // for the client
      ToastEventBus.emit('add', {
        severity: 'error',
        summary: 'Uh oh',
        detail: 'Something went wrong when trying to update the workday.',
        life: 4000,
      });
    },
  });

  // mutation that pauses and unpauses the workday
  const { mutate: pauseWorkday } = useMutation<WorkDay, Error>({
    mutationFn: async (): Promise<WorkDay> => {
      try {
        console.log('[workdayService] pauseWorkday mutation running');

        const now = new Date().toISOString();

        const response = await $fetch<WorkdayApiResponse>('/api/workday', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'pause', timestamp: now }),
        });

        if (response instanceof H3Error) {
          console.error(
            '[workdayService] error while mutating workday: ',
            response
          );
          throw new Error(response.message);
        }

        return {
          start_time: new Date(response.start_time),
          end_time: response.end_time ? new Date(response.end_time) : null,
          segments: response.segments
            ? response.segments.map((segment) => {
                return {
                  start_time: new Date(segment.start_time),
                  end_time: segment.end_time
                    ? new Date(segment.end_time)
                    : null,
                  activity: segment.activity,
                };
              })
            : null,
        };
      } catch (error) {
        console.error('Failed to pause workday via API', error);
        throw error;
      }
    },
    onSuccess: async (updatedWorkdayData) => {
      console.log(
        '[workdayService] pauseWorkday successful, got: ',
        updatedWorkdayData
      );
      // https://tanstack.com/query/v5/docs/framework/vue/guides/updates-from-mutation-responses
      queryClient.setQueryData(['workday_service'], updatedWorkdayData);

      // get the last segment in the array
      const segment = updatedWorkdayData.segments?.at(-1);
      const startTime = segment?.start_time && new Date(segment.start_time);
      const activity = segment?.activity;

      // advise the user of the successful mutation
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
      // for the devs
      console.error(`Failed to pause workday: ${error.message}.`);

      // for the client
      ToastEventBus.emit('add', {
        severity: 'error',
        summary: 'Uh oh',
        detail: 'Something went wrong when trying to update the workday.',
        life: 4000,
      });
    },
  });

  // various boolean workday statuses

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

  // https://tanstack.com/query/v5/docs/framework/vue/guides/ssr
  onServerPrefetch(async () => {
    await fetchOnServer();
  });

  // socket.io client
  let socket: ReturnType<typeof useSocket>;

  onMounted(() => {
    try {
      socket = useSocket();
      console.log(
        `[workdayService] mounted, opening socket listener for id ${socket.id}`
      );

      // when it hears an update on the websocket connection,
      socket.on('workdayUpdate', (data: WorkDay) => {
        console.log('[workdayService] receiving updated data: ', data);
        // set the query to the newly received data
        queryClient.setQueryData(['workday_service'], {
          start_time: new Date(data.start_time),
          end_time: data.end_time ? new Date(data.end_time) : null,
          segments: data.segments?.map((segment) => {
            return {
              start_time: new Date(segment.start_time),
              end_time: segment.end_time ? new Date(segment.end_time) : null,
              activity: segment.activity,
            };
          }),
        });
      });
    } catch (error) {
      console.error(
        '[workdayService] encountered an error while listening for socket updates: ',
        error
      );
    }
  });

  onUnmounted(() => {
    try {
      socket.off('workdayUpdate');
      console.log(
        `[workdayService] socket connection is now ${socket.disconnected === true ? 'disconnected' : 'connected'}.`
      );
      socket.disconnect();
    } catch (error) {
      console.error(
        '[workdayService] encountered an error while disconnecting from socket: ',
        error
      );
    }
  });

  // all the methods available for use on the useWorkday function
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
    console.log(
      '[workdayService] did not find existing instance of singleton.'
    );
    workdayInstance = createWorkdayService();
  } else {
    console.log('[workdayService] found existing instance of singleton.');
  }
  return workdayInstance;
}

export interface WorkDay {
  start_time: Date;
  end_time: Date | null;
  segments:
    | {
        start_time: Date;
        end_time: Date | null;
        activity: ActivityType;
      }[]
    | null;
}

export enum ActivityType {
  Working = 'working',
  OnBreak = 'on break',
}
