import { useQuery, useMutation } from '@tanstack/vue-query';
import { useToast } from 'primevue';

export function workdayService() {
  const toast = useToast();

  const workdayData = useState<{
    start_time: Date | null;
    end_time: Date | null;
  }>('workdayData', () => ({
    start_time: new Date(),
    end_time: null,
  }));

  const {
    data: workday,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['workday'],
    queryFn: async (): Promise<{
      start_time: Date | null;
      end_time: Date | null;
    }> => {
      try {
        const response = await fetch('/api/workday');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching workday from API', error);
        throw error;
      }
    },
    enabled: true, // TODO: figure out when to enable this
  });

  const { mutate: updateWorkday } = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch('/api/workday', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'toggle' }), // Send 'toggle' action
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Failed to update workday via API', error);
        throw error;
      }
    },
    onSuccess: (updatedWorkdayData) => {
      refetch();
      const startTime: Date = updatedWorkdayData.start_time;
      const endTime: Date = updatedWorkdayData.end_time;
      toast.add({
        severity: startTime ? 'success' : 'error',
        summary: `${startTime ? 'Opened' : 'Closed '} workday at ${startTime ? startTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : endTime ? endTime.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : 'error'}`,
        detail: startTime
          ? 'Have a productive day!'
          : 'Enjoy your evening!',
        life: 4000,
      });
    },
    onError: (error) => {
      console.error(`Failed to update workday: ${error.message}.`);
    },
  });

  return { workday, updateWorkday, isLoading, refetch };
}
