import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Activity name mapping - translates incoming names to Supabase activity names
const activityNameMapping: Record<string, string> = {
  "The OG Bungy Jump": "The OG Bungy Jump",
  "Valley Cut Rope Jump": "Valley Cut Rope Jump",
  "FlyingFox(Tandem/Triple)": "Fying Fox (Tandem or triple Ride)",
  "Flying Fox (Solo)": "Flying Fox - Solo",
  "BungyJump+ValleyRopeJump": "Bungy Jump + Valley Rope Jump/Cut chord rope",
  "BungyJump+Cut Chord Rope": "Bungy Jump + Valley Rope Jump/Cut chord rope",
  "Himalayan Bungy": "Himalayan Bungy – 117m",
  "Free Style Bungy(111M)": "Free style Himalayan Bungy - 111 M",
  "Tandem Bungy(111M)": "Himalayan Tandem Bungy – 111m",
  "Giant Swing": "Himalayan Giant Swing",
  "Splash Bungee": "Splash Bungee",
  "Couple Bungee": "Couple Bungee Normal/Splash",
  "Bungee with air bag": "Bungee with air bag",
  "Rocket bungy": "Rocket bungy",
  "Tower Top Swing": "Tower top swing",
  "Zipline": "Zipline",
  "Glass Sky walk": "Glass Sky Walk",
  "Free Style Bungee": "Free Style Bungee",
  "Bungee Jump": "Bungee Jump",
  "Couple Bungee Jump": "Couple Bungee Jump",
  "SCAD Jump": "SCAD Jump",
  "Splash Bungy": "Splash Bungy",
  "Couple Splash Bungee": "Couple Splash Bungee",
  "Giant Swing ": "Giant Swing ",
  "Combo 5": "Combo 5",
  "9 Km": "9 Km",
  "25 Km": "25 Km",
  "16 Km": "16 Km",
  "Activa/Similar 2wheelere": "Activa or similar 2 wheeler",
  "RE Hunter 350cc": "Royal Enfield Hunter 350 CC",
  "RE Classic 350": "Royal Enfield Classic",
  "Meteor 1100": "Meteor 1100",
  "Hero Xpulse": "Hero Xpulse",
  "RE Himalayan 450cc": "Royal Enfield Himalayan 450 CC",
  "Classic Flight": "Classic Flight",
  "Customised Long Flight": "Customised Long Flight",
};

interface GetTimeSlotsRequest {
  name: string;   // Activity name or activity ID
  date: string;   // Date in yyyy-mm-dd format
}

interface TimeSlotData {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
}

interface TimeSlotOption {
  label: string;
  value: string;
}

interface TimeSlotResponse {
  options: TimeSlotOption[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, date }: GetTimeSlotsRequest = await req.json();

    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Date is required in yyyy-mm-dd format' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Activity name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Expected yyyy-mm-dd' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Parse the provided date
    const providedDate = new Date(date + 'T00:00:00Z');
    
    // Get current time in IST (UTC+5:30)
    const getCurrentTimeIST = () => {
      const now = new Date();
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const istTime = new Date(utcTime + istOffset);
      return istTime;
    };

    const currentTimeIST = getCurrentTimeIST();
    
    // Get today's date in IST (in yyyy-mm-dd format)
    const todayIST = new Date(currentTimeIST.toISOString().split('T')[0] + 'T00:00:00Z');
    
    // Check if the provided date is today
    const isToday = providedDate.getTime() === todayIST.getTime();

    // Get current time in minutes (IST)
    const currentTimeMinutes = currentTimeIST.getHours() * 60 + currentTimeIST.getMinutes();

    // Helper function to convert time string (HH:mm) to minutes
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Helper function to format time to 12-hour format
    const formatTime = (time: string): string => {
      const [hours, minutes] = time.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const ampm = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    };

    // First, try to find the activity by ID, then by name
    let activityId = name;
    
    // Check if name is not a UUID, then search by name
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(name)) {
      // Apply name mapping if exists
      const mappedName = activityNameMapping[name] || name;
      
      console.log('Activity name mapping:', { original: name, mapped: mappedName });
      
      const { data: activities, error: activityError } = await supabase
        .from('activities')
        .select('id')
        .eq('name', mappedName)
        .eq('is_active', true)
        .limit(1);

      if (activityError) {
        console.error('Error fetching activity:', activityError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch activity' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (!activities || activities.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Activity not found', options: [] }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      activityId = activities[0].id;
    }

    // Fetch time slots for this activity
    const { data: timeSlots, error: slotsError } = await supabase
      .from('time_slots')
      .select('id, start_time, end_time, capacity')
      .eq('activity_id', activityId)
      .order('start_time', { ascending: true });

    if (slotsError) {
      console.error('Error fetching time slots:', slotsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch time slots' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!timeSlots || timeSlots.length === 0) {
      return new Response(
        JSON.stringify({ options: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Filter and format time slots
    const options: TimeSlotOption[] = (timeSlots as TimeSlotData[])
      .filter((slot) => {
        // If it's today, filter out past time slots
        if (isToday) {
          const slotTimeMinutes = timeToMinutes(slot.start_time);
          return slotTimeMinutes >= currentTimeMinutes;
        }
        // For future dates, include all slots
        return true;
      })
      .map((slot) => ({
        label: formatTime(slot.start_time),
        value: slot.start_time
      }));

    const response: TimeSlotResponse = {
      options
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    console.error('Error in get-time-slots function:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
