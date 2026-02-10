/**
 * Example usage of the get-time-slots edge function
 * This file demonstrates how to call the edge function from your React components
 */

import { supabase } from "@/integrations/supabase/client";

interface TimeSlotOption {
  label: string;
  value: string;
}

interface TimeSlotResponse {
  options: TimeSlotOption[];
}

/**
 * Fetches available time slots for a given activity and date
 * @param activityName - Activity name or activity UUID
 * @param date - Date in yyyy-mm-dd format
 * @returns Promise with time slot options
 */
export const getTimeSlots = async (
  activityName: string,
  date: string
): Promise<TimeSlotOption[]> => {
  try {
    const { data, error } = await supabase.functions.invoke("get-time-slots", {
      body: {
        name: activityName,
        date,
      },
    });

    if (error) {
      console.error("Error fetching time slots:", error);
      throw error;
    }

    const response = data as TimeSlotResponse;
    return response.options || [];
  } catch (error) {
    console.error("Failed to fetch time slots:", error);
    throw error;
  }
};

/**
 * Example usage in a React component with React Query
 */
export const useTimeSlots = (activityName: string | undefined, date: string | undefined) => {
  // This is an example using @tanstack/react-query
  // You can use this in your components like SlotSelector.tsx
  
  // import { useQuery } from "@tanstack/react-query";
  
  // const { data: timeSlots, isLoading, error } = useQuery({
  //   queryKey: ["time-slots", activityName, date],
  //   queryFn: async () => {
  //     if (!date || !activityName) return [];
  //     return await getTimeSlots(activityName, date);
  //   },
  //   enabled: !!date && !!activityName,
  // });
  
  // return { timeSlots, isLoading, error };
};

/**
 * Example usage in a component
 */
export const ExampleComponent = () => {
  // const [selectedActivity, setSelectedActivity] = useState<string>();
  // const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  // const { timeSlots, isLoading } = useTimeSlots(
  //   selectedActivity,
  //   selectedDate?.toISOString().split('T')[0]
  // );

  // return (
  //   <div>
  //     {isLoading ? (
  //       <p>Loading time slots...</p>
  //     ) : (
  //       <div>
  //         {timeSlots?.map((slot) => (
  //           <button key={slot.value} value={slot.value}>
  //             {slot.label}
  //           </button>
  //         ))}
  //       </div>
  //     )}
  //   </div>
  // );
};

/**
 * Direct usage example (without React Query)
 */
export const fetchTimeSlotsExample = async () => {
  // For today's date with an activity
  const today = new Date().toISOString().split('T')[0];
  const todaySlots = await getTimeSlots('Paragliding Adventure', today);
  console.log("Today's slots:", todaySlots);

  // For a future date with a different activity
  const futureDate = '2025-12-25';
  const futureSlots = await getTimeSlots('Mountain Trekking', futureDate);
  console.log("Future slots:", futureSlots);

  // Using activity UUID
  const activityId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const slotsById = await getTimeSlots(activityId, futureDate);
  console.log("Slots by ID:", slotsById);
};
