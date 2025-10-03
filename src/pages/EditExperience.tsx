
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateExperienceForm } from "@/components/CreateExperienceForm";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect } from "react";

const EditExperience = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isVendor, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isVendor) {
        navigate('/profile');
      }
    }
  }, [user, isVendor, authLoading, roleLoading, navigate]);

  const { data: experience, isLoading } = useQuery({
    queryKey: ['experience', id],
    queryFn: async () => {
      if (!id) throw new Error('Experience ID is required');
      
      // Fetch experience with categories
      const { data: experienceData, error: experienceError } = await supabase
        .from('experiences')
        .select(`
          *,
          experience_categories (
            category_id
          ),
            experience_images (
              id,
      image_url,
      alt_text,
      display_order,
      is_primary
            )
        `)
        .eq('id', id)
        .single();

      if (experienceError) throw experienceError;
      
      // Fetch activities for this experience
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select(`
          *,
          time_slots (
            id,
            start_time,
            end_time,
            capacity
          )
        `)
        .eq('experience_id', id)
        .eq('is_active', true)
        .order('display_order');

      if (activitiesError) throw activitiesError;
      
      // If no activities exist, fetch legacy time slots for backward compatibility
      let legacyTimeSlots: any[] = [];
      if (!activitiesData || activitiesData.length === 0) {
        const { data: timeSlotsData, error: timeSlotsError } = await supabase
          .from('time_slots')
          .select('id, start_time, end_time, capacity')
          .eq('experience_id', id)
          .order('start_time');
        
        if (timeSlotsError) throw timeSlotsError;
        legacyTimeSlots = timeSlotsData || [];
      }
      
      // Transform the data to include category_ids array
      const categoryIds = experienceData.experience_categories?.map(ec => ec.category_id) || [];
      
      // Transform activities data to match our Activity interface
      const transformedActivities = activitiesData?.map(activity => ({
        id: activity.id,
        name: activity.name,
        distance: activity.distance,
        duration: activity.duration,
        price: activity.price,
        discount_percentage: activity.discount_percentage,
        discounted_price: activity.discounted_price,  
        currency: activity.currency,
        timeSlots: activity.time_slots || []
      })) || [];
      
      return {
        ...experienceData,
        category_ids: categoryIds,
        activities: transformedActivities,
        legacyTimeSlots: legacyTimeSlots,
        image_urls: experienceData.experience_images.map(image => image.image_url),
      };
    },
    enabled: !!id
  });


  console.log("experience", experience);  

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || !isVendor) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Experience Not Found</h1>
            <Button onClick={() => navigate('/profile')}>
              Back to Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-4">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
        </div>

        <CreateExperienceForm initialData={experience} isEditing={true} />
      </div>
    </div>
  );
};

export default EditExperience;
