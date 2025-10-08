import { DestinationDropdown } from "@/components/DestinationDropdown";
import { TimeSlotManager } from "@/components/TimeSlotManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Upload, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  capacity: number;
  activity_id?: string; // Add this line
}

interface Activity {
  id: string;
  name: string;
  distance?: string;
  duration: string;
  price: number;
  discount_percentage: number | null;
  currency: string;
  timeSlots: TimeSlot[];
  discounted_price: number;
}

interface ExperienceData {
  discounted_price: number;
  id?: string;
  title: string;
  description: string;
  category_ids: string[];
  original_price: number;
  discount_percentage: number | null;
  currency: string;
  duration: string;
  group_size: string;
  location: string;
  start_point: string;
  end_point: string;
  distance_km: number;
  days_open: string[];
  price: number;
  activities?: Activity[];
  destination_id?: string;
  legacyTimeSlots?: TimeSlot[];
  image_urls?: string[];
  image_url?: string;
}

interface CreateExperienceFormProps {
  initialData?: ExperienceData;
  isEditing?: boolean;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function CreateExperienceForm({
  initialData,
  isEditing = false,
}: CreateExperienceFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [videoPreviewUrls, setVideoPreviewUrls] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category_ids: initialData?.category_ids || [],
    location: initialData?.location || "",
    start_point: initialData?.start_point || "",
    end_point: initialData?.end_point || "",
    days_open: initialData?.days_open || [],
    destination_id: initialData?.destination_id || "",
    image_url: initialData?.image_url || "",
  });

  // React Quill configuration
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
  ];

  // Calculate discount percentage if we have original price and current price
  useEffect(() => {
    if (
      initialData?.original_price &&
      initialData?.price &&
      initialData.original_price > initialData.price
    ) {
      const discount =
        ((initialData.original_price - initialData.price) /
          initialData.original_price) *
        100;
      setFormData((prev) => ({
        ...prev,
        discount_percentage: discount.toFixed(2),
      }));

      // setPreviewUrls((prev) => [...prev, initialData.image_url || ""]);
    }
  }, [initialData]);

  const firstRendered = useRef(false);

  useEffect(() => {
    if (initialData?.image_urls && !firstRendered.current) {
      firstRendered.current = true;
      setPreviewUrls((prev) => [...prev, ...(initialData?.image_urls || [])]);
    }
  }, [initialData]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Load existing activities when editing
  useEffect(() => {
    if (isEditing && initialData) {
      if (initialData.activities && initialData.activities.length > 0) {
        // Experience has activities - use them
        setActivities(initialData.activities);
      } else {
        // Old experience without activities - create default activity from legacy data
        const defaultActivity: Activity = {
          id: Date.now().toString(),
          name: initialData.title || "Experience Activity",
          distance:
            initialData.distance_km === 0
              ? "On-site"
              : `${initialData.distance_km}km`,
          duration: initialData.duration || "Not specified",
          price: initialData.price || 0,
          discount_percentage: initialData.discount_percentage || 0,
          discounted_price: initialData.discounted_price || 0,
          currency: initialData.currency || "INR",
          timeSlots: initialData.legacyTimeSlots || [], // Use legacy time slots if available
        };
        setActivities([defaultActivity]);
      }
    }
  }, [isEditing, initialData]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days_open: prev.days_open.includes(day)
        ? prev.days_open.filter((d) => d !== day)
        : [...prev.days_open, day],
    }));
  };

  const handleSelectAllDays = () => {
    const allSelected = formData.days_open.length === DAYS_OF_WEEK.length;
    setFormData((prev) => ({
      ...prev,
      days_open: allSelected ? [] : [...DAYS_OF_WEEK],
    }));
  };

  const addActivity = () => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      name: "",
      distance: "",
      duration: "",
      price: 0,
      discount_percentage: null,
      currency: "INR",
      timeSlots: [],
      discounted_price: 0,
    };
    setActivities((prev) => [...prev, newActivity]);
  };

  const removeActivity = (activityId: string) => {
    setActivities((prev) =>
      prev.filter((activity) => activity.id !== activityId)
    );
  };

  const updateActivity = (
    activityId: string,
    field: keyof Activity,
    value: string | number | TimeSlot[]
  ) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id === activityId) {
          const updated = { ...activity, [field]: value };
          // Auto-calculate discounted price when discount percentage changes
          if (field === "discount_percentage" || field === "price") {
            const discount =
              typeof value === "number" && field === "discount_percentage"
                ? value
                : activity.discount_percentage;
            const price =
              typeof value === "number" && field === "price"
                ? value
                : activity.price;
            updated.discounted_price = price - (price * discount) / 100;
          }
          return updated;
        }
        return activity;
      })
    );
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Separate images and videos
    const images = files.filter((file) => file.type.startsWith("image/"));
    const videos = files.filter((file) => file.type.startsWith("video/"));

    // Handle images
    if (selectedImages.length + images.length > 10) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 10 images.",
        variant: "destructive",
      });
      return;
    }

    // Handle videos
    if (selectedVideos.length + videos.length > 1) {
      toast({
        title: "Too many videos",
        description: "You can upload a maximum of 1 video.",
        variant: "destructive",
      });
      return;
    }

    // Update images state
    const newImages = [...selectedImages, ...images];
    setSelectedImages(newImages);

    // Update videos state
    const newVideos = [...selectedVideos, ...videos];
    setSelectedVideos(newVideos);

    // Create preview URLs for images
    const newImagePreviewUrls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newImagePreviewUrls]);

    // Create preview URLs for videos
    const newVideoPreviewUrls = videos.map((file) => URL.createObjectURL(file));
    setVideoPreviewUrls((prev) => [...prev, ...newVideoPreviewUrls]);
  };

  const removeMedia = (index: number, isVideo: boolean) => {
    if (isVideo) {
      URL.revokeObjectURL(videoPreviewUrls[index]);
      setVideoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
      setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
    } else {
      URL.revokeObjectURL(previewUrls[index]);
      setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
      setRemovedImages((prev) => [...prev, previewUrls[index]]);
    }
  };

  const uploadImages = async (experienceId: string) => {
    if (selectedImages.length === 0) return null;

    const uploadPromises = selectedImages.map(async (file, index) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${experienceId}/${Date.now()}_${index}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("experience-images")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("experience-images").getPublicUrl(fileName);

      return {
        image_url: publicUrl,
        display_order: index,
        is_primary: index === 0,
        experience_id: experienceId,
      };
    });

    const imageData = await Promise.all(uploadPromises);

    const { error } = await supabase
      .from("experience_images")
      .insert(imageData);

    if (error) throw error;

    // Return the primary image URL (first image)
    return imageData[0]?.image_url || null;
  };

  const createActivities = async (experienceId: string) => {
    if (activities.length === 0) {
      console.warn("No activities to create");
      return;
    }

    // Create activities without the id field
    const activitiesData = activities.map((activity, index) => ({
      experience_id: experienceId,
      name: activity.name,
      distance: activity.distance,
      duration: activity.duration,
      price: activity.price,
      discount_percentage: activity.discount_percentage,
      discounted_price: activity.discounted_price,
      currency: activity.currency,
      display_order: index,
      is_active: true,
    }));

    const { data: createdActivities, error: activitiesError } = await supabase
      .from("activities")
      .insert(activitiesData)
      .select("*");
    // Get back all fields including the generated id

    if (activitiesError) {
      console.error("Error creating activities:", activitiesError);
      throw activitiesError;
    }

    if (!createdActivities || createdActivities.length === 0) {
      throw new Error("No activities were created");
    }

    // Create time slots for each activity
    const allTimeSlots = activities.flatMap((activity, index) => {
      const createdActivity = createdActivities[index];
      return activity.timeSlots.map((slot) => ({
        experience_id: experienceId,
        activity_id: createdActivity.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: slot.capacity,
      }));
    });

    if (allTimeSlots.length > 0) {
      const { error: timeSlotsError } = await supabase
        .from("time_slots")
        .insert(allTimeSlots);

      if (timeSlotsError) {
        console.error("Error creating time slots:", timeSlotsError);
        throw timeSlotsError;
      }
    }
  };

  const updateActivities = async (experienceId: string) => {
    // Separate existing and new activities
    const existingActivities = activities.filter((a) => a.id.length > 20); // Supabase UUIDs are longer
    const newActivities = activities.filter((a) => a.id.length <= 20); // Client-side IDs are timestamps

    // console.log("Existing activities to update:", existingActivities);
    // console.log("New activities to create:", newActivities);

    // Update existing activities
    for (const activity of existingActivities) {
      const updateData = {
        name: activity.name,
        distance: activity.distance || null,
        duration: activity.duration || null,
        price: activity.price,
        discount_percentage: activity.discount_percentage,
        discounted_price: activity.discounted_price,
        currency: activity.currency,
        display_order: activities.indexOf(activity),
        is_active: true,
      };

      // console.log(`Updating activity ${activity.id} with data:`, updateData);

      const { error: updateError } = await supabase
        .from("activities")
        .update(updateData)
        .eq("id", activity.id);

      if (updateError) {
        console.error("Error updating activity:", updateError);
        throw updateError;
      }

      // Update time slots for existing activity
      // First, get all existing time slots for this activity
      const { data: existingTimeSlots, error: fetchTimeSlotsError } =
        await supabase
          .from("time_slots")
          .select("id, start_time, end_time, capacity")
          .eq("activity_id", activity.id);

      if (fetchTimeSlotsError) {
        console.error(
          "Error fetching existing time slots:",
          fetchTimeSlotsError
        );
        throw fetchTimeSlotsError;
      }

      // Check which time slots have bookings
      const timeSlotIds = existingTimeSlots?.map((ts) => ts.id) || [];
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("time_slot_id")
        .in("time_slot_id", timeSlotIds);

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
        throw bookingsError;
      }

      // Get time slot IDs that have bookings
      const bookedTimeSlotIds = new Set(
        bookingsData?.map((b) => b.time_slot_id) || []
      );

      // Separate time slots with bookings from those without
      const timeSlotsWithBookings =
        existingTimeSlots?.filter((ts) => bookedTimeSlotIds.has(ts.id)) || [];
      const timeSlotsWithoutBookings =
        existingTimeSlots?.filter((ts) => !bookedTimeSlotIds.has(ts.id)) || [];

      // Delete only time slots that don't have bookings
      if (timeSlotsWithoutBookings.length > 0) {
        const timeSlotIdsToDelete = timeSlotsWithoutBookings.map((ts) => ts.id);
        const { error: deleteTimeSlotsError } = await supabase
          .from("time_slots")
          .delete()
          .in("id", timeSlotIdsToDelete);

        if (deleteTimeSlotsError) {
          console.error(
            "Error deleting unused time slots:",
            deleteTimeSlotsError
          );
          throw deleteTimeSlotsError;
        }
      }

      // Update existing time slots that have bookings (if they match new slots)
      for (const existingSlot of timeSlotsWithBookings) {
        const matchingNewSlot = activity.timeSlots.find(
          (newSlot) =>
            newSlot.start_time === existingSlot.start_time &&
            newSlot.end_time === existingSlot.end_time
        );

        if (matchingNewSlot) {
          // Update the existing slot with new capacity
          const { error: updateSlotError } = await supabase
            .from("time_slots")
            .update({ capacity: matchingNewSlot.capacity })
            .eq("id", existingSlot.id);

          if (updateSlotError) {
            console.error("Error updating time slot:", updateSlotError);
            throw updateSlotError;
          }
        } else {
          // Time slot exists with bookings but doesn't match new slots
          // We can't delete it, so we'll keep it and log a warning
          console.warn(
            `Time slot ${existingSlot.start_time}-${existingSlot.end_time} has existing bookings and cannot be removed`
          );
        }
      }

      // Create new time slots that don't match ANY existing ones (with or without bookings)
      const allExistingTimeSlots = [
        ...timeSlotsWithBookings,
        ...timeSlotsWithoutBookings,
      ];
      const newTimeSlotsToCreate = activity.timeSlots.filter(
        (newSlot) =>
          !allExistingTimeSlots.some(
            (existingSlot) =>
              existingSlot.start_time === newSlot.start_time &&
              existingSlot.end_time === newSlot.end_time
          )
      );

      if (newTimeSlotsToCreate.length > 0) {
        const timeSlotData = newTimeSlotsToCreate.map((slot) => ({
          experience_id: experienceId,
          activity_id: activity.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          capacity: slot.capacity,
        }));

        const { error: createTimeSlotsError } = await supabase
          .from("time_slots")
          .insert(timeSlotData);

        if (createTimeSlotsError) {
          console.error("Error creating new time slots:", createTimeSlotsError);
          throw createTimeSlotsError;
        }
      }
    }

    // Create new activities
    if (newActivities.length > 0) {
      const newActivitiesData = newActivities.map((activity, index) => ({
        experience_id: experienceId,
        name: activity.name,
        distance: activity.distance,
        duration: activity.duration,
        price: activity.price,
        discount_percentage: activity.discount_percentage,
        discounted_price: activity.discounted_price,
        currency: activity.currency,
        display_order: existingActivities.length + index,
        is_active: true,
      }));

      console.log("Creating new activities:", newActivitiesData);

      const { data: createdActivities, error: createError } = await supabase
        .from("activities")
        .insert(newActivitiesData)
        .select("*");

      if (createError) {
        console.error("Error creating activities:", createError);
        throw createError;
      }

      // Create time slots for new activities
      const newTimeSlots = newActivities.flatMap((activity, index) => {
        const createdActivity = createdActivities[index];
        return activity.timeSlots.map((slot) => ({
          experience_id: experienceId,
          activity_id: createdActivity.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          capacity: slot.capacity,
        }));
      });

      if (newTimeSlots.length > 0) {
        const { error: timeSlotsError } = await supabase
          .from("time_slots")
          .insert(newTimeSlots);

        if (timeSlotsError) {
          console.error(
            "Error creating time slots for new activities:",
            timeSlotsError
          );
          throw timeSlotsError;
        }
      }
    }

    // Handle deleted activities - Using a simpler approach
    // First get all activities for this experience
    const { data: allExistingActivities, error: fetchError } = await supabase
      .from("activities")
      .select("id")
      .eq("is_active", true)
      .eq("experience_id", experienceId);

    if (fetchError) {
      console.error("Error fetching existing activities:", fetchError);
      throw fetchError;
    }

    // Find activities to delete (those not in our current activities list)
    const currentActivityIds = existingActivities.map((a) => a.id);
    const activitiesToDelete = (allExistingActivities || []).filter(
      (existing) => !currentActivityIds.includes(existing.id)
    );

    // console.log("Activities to delete:", activitiesToDelete);

    // Delete activities that are no longer needed
    for (const activityToDelete of activitiesToDelete) {
      const { error: deleteError } = await supabase
        .from("activities")
        .delete()
        .eq("id", activityToDelete.id);

      if (deleteError) {
        console.error("Error deleting activity:", deleteError);
        throw deleteError;
      }
    }

    // console.log("Activities update completed successfully");
  };

  console.log("activities", activities);

  const createExperienceCategories = async (
    experienceId: string,
    categoryIds: string[]
  ) => {
    if (categoryIds.length === 0) return;

    const experienceCategoriesData = categoryIds.map((categoryId) => ({
      experience_id: experienceId,
      category_id: categoryId,
    }));

    const { error } = await supabase
      .from("experience_categories")
      .insert(experienceCategoriesData);

    if (error) throw error;
  };

  const updateExperienceCategories = async (
    experienceId: string,
    categoryIds: string[]
  ) => {
    // First, delete existing category associations
    const { error: deleteError } = await supabase
      .from("experience_categories")
      .delete()
      .eq("experience_id", experienceId);

    if (deleteError) throw deleteError;

    // Then create new associations
    await createExperienceCategories(experienceId, categoryIds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description:
          "Please sign in to " +
          (isEditing ? "update" : "create") +
          " an experience.",
        variant: "destructive",
      });
      return;
    }

    if (!isEditing && selectedImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please add at least one image for your experience.",
        variant: "destructive",
      });
      return;
    }

    if (activities.length === 0) {
      toast({
        title: "Activities required",
        description: "Please add at least one activity for your experience.",
        variant: "destructive",
      });
      return;
    }

    // Check if all activities have at least one time slot
    const activitiesWithoutTimeSlots = activities.filter(
      (activity) => activity.timeSlots.length === 0
    );
    if (activitiesWithoutTimeSlots.length > 0) {
      toast({
        title: "Time slots required",
        description: "Please add at least one time slot for each activity.",
        variant: "destructive",
      });
      return;
    }

    // Validate activity data
    const invalidActivities = activities.filter(
      (activity) =>
        !activity.name.trim() ||
        activity.price <= 0 ||
        activity.discount_percentage < 0 ||
        activity.discount_percentage > 100
    );
    console.log("invalidActivities", invalidActivities);
    if (invalidActivities.length > 0) {
      toast({
        title: "Invalid activity data",
        description:
          "Please ensure all activities have valid name, distance, duration, price, and discount percentage.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (formData.category_ids.length === 0) {
        toast({
          title: "Categories required",
          description:
            "Please select at least one category for your experience.",
          variant: "destructive",
        });
        return;
      }

      // Get the first category name for the legacy category field
      const primaryCategory = categories.find(
        (c) => c.id === formData.category_ids[0]
      );

      // Calculate the minimum price from activities for legacy pricing
      const minPrice =
        activities.length > 0 ? Math.min(...activities.map((a) => a.price)) : 0;

      const minDiscountPercentage =
        activities.length > 0
          ? Math.min(...activities.map((a) => a.discount_percentage))
          : 0;

      const experienceData = {
        title: formData.title,
        description: formData.description,
        category: primaryCategory?.name || "General", // Legacy field - use first selected category
        price: minPrice,
        discount_percentage: minDiscountPercentage,
        original_price: null, // No longer used
        currency: activities.length > 0 ? activities[0].currency : "INR", // Use first activity's currency
        duration: null, // Legacy field - no longer used
        group_size: null, // Legacy field - no longer used
        location: formData.location,
        start_point: formData.start_point,
        end_point: formData.end_point,
        distance_km: 0, // Legacy field - kept for compatibility
        days_open: formData.days_open,
        vendor_id: user.id,
        destination_id: formData.destination_id,
      };

      console.log("experienceData", experienceData);

      if (isEditing && initialData?.id) {
        // Update existing experience
        const { error: experienceError } = await supabase
          .from("experiences")
          .update(experienceData)
          .eq("id", initialData.id)
          .eq("is_active", true);

        if (experienceError) throw experienceError;

        // Upload new images if any
        if (selectedImages.length > 0) {
          const primaryImageUrl = await uploadImages(initialData.id);

          if (primaryImageUrl) {
            const { error: updateError } = await supabase
              .from("experiences")
              .update({ image_url: primaryImageUrl })
              .eq("id", initialData.id)
              .eq("is_active", true);

            if (updateError) throw updateError;
          }
        }

        // In handleSubmit (inside isEditing && initialData.id case)
        if (removedImages.length > 0) {
          for (const imageUrl of removedImages) {
            // 1. Delete from storage (if stored in Supabase Storage)
            const path = imageUrl.split("/").pop(); // adjust if you save full URL
            await supabase.storage.from("your-bucket").remove([path]);

            // 2. If you save multiple image URLs in a table, update DB too
            // Example: remove from experience_images table
            await supabase
              .from("experience_images")
              .delete()
              .eq("experience_id", initialData.id)
              .eq("image_url", imageUrl);
          }
        }

        await updateActivities(initialData.id);
        await updateExperienceCategories(initialData.id, formData.category_ids);

        toast({
          title: "Experience updated successfully!",
          description: "Your experience has been updated.",
        });
      } else {
        // Create new experience
        const { data: experience, error: experienceError } = await supabase
          .from("experiences")
          .insert([{ ...experienceData, image_url: "" }])
          .select()
          .single();

        if (experienceError) throw experienceError;

        // Upload images and get primary image URL
        const primaryImageUrl = await uploadImages(experience.id);

        // Update the experience with the primary image URL
        if (primaryImageUrl) {
          const { error: updateError } = await supabase
            .from("experiences")
            .update({ image_url: primaryImageUrl })
            .eq("id", experience.id)
            .eq("is_active", true);

          if (updateError) throw updateError;
        }

        await createActivities(experience.id);
        await createExperienceCategories(experience.id, formData.category_ids);

        toast({
          title: "Experience created successfully!",
          description:
            "Your experience has been created with time slots and is now available.",
        });
      }

      navigate("/profile");
    } catch (error) {
      console.error(
        "Error " + (isEditing ? "updating" : "creating") + " experience:",
        error
      );
      toast({
        title: "Error " + (isEditing ? "updating" : "creating") + " experience",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto border-2 border-brand-primary rounded-xl">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Experience" : "Create New Experience"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-start">
              <Label htmlFor="title">Experience Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                placeholder="Enter experience title"
              />
            </div>

            <div className="space-y-2 text-start">
              <Label htmlFor="categories">Categories *</Label>
              <Select
                value={
                  formData.category_ids.length > 0
                    ? formData.category_ids[0]
                    : ""
                }
                onValueChange={(value) => {
                  if (value && !formData.category_ids.includes(value)) {
                    setFormData((prev) => ({
                      ...prev,
                      category_ids: [...prev.category_ids, value],
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select categories">
                    {formData.category_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {formData.category_ids.map((categoryId) => {
                          const category = categories.find(
                            (c) => c.id === categoryId
                          );
                          return category ? (
                            <span
                              key={categoryId}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-md"
                            >
                              {category.icon && <span>{category.icon}</span>}
                              {category.name}
                              <X
                                className="h-3 w-3 ml-1 cursor-pointer hover:text-orange-600"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setFormData((prev) => ({
                                    ...prev,
                                    category_ids: prev.category_ids.filter(
                                      (id) => id !== categoryId
                                    ),
                                  }));
                                }}
                              />
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      "Select categories"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(
                      (category) => !formData.category_ids.includes(category.id)
                    )
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {category.icon && <span>{category.icon}</span>}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  {categories.filter(
                    (category) => !formData.category_ids.includes(category.id)
                  ).length === 0 && (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      All categories selected
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 text-start">
            <Label htmlFor="description">Description *</Label>
            <div className="border rounded-md overflow-hidden">
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={(value) => handleInputChange("description", value)}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Describe the experience.."
                style={{
                  minHeight: "400px",
                  backgroundColor: "transparent",
                }}
              />
            </div>
          </div>

          <div className="space-y-2 text-start">
            <Label htmlFor="location">Google Maps Link *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              required
              placeholder="Paste Google Maps link to meeting point/location"
              // className={
              //   !formData.location.includes("maps.google.com") ||
              //   !formData.location.includes("maps.app.goo")
              //     ? "border-red-500"
              //     : ""
              // }
            />
            {/* {formData.location &&
              (!formData.location.includes("maps.google.com") ||
                !formData.location.includes("maps.app.goo")) && (
                <p className="text-sm text-red-500">
                  Please enter a valid Google Maps link
                </p>
              )} */}
          </div>

          <div className="text-start">
            <DestinationDropdown
              value={formData.destination_id}
              onValueChange={(value) =>
                handleInputChange("destination_id", value)
              }
              required={true}
              className=""
            />
          </div>

          {/* Activities Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Activities *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addActivity}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Activity
              </Button>
            </div>

            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No activities added yet. Click "Add Activity" to get started.
              </div>
            )}

            {activities.map((activity, index) => (
              <Card key={activity.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Activity {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeActivity(activity.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2 text-start">
                    <Label htmlFor={`activity-name-${activity.id}`}>
                      Activity Name *
                    </Label>
                    <Input
                      id={`activity-name-${activity.id}`}
                      value={activity.name}
                      onChange={(e) =>
                        updateActivity(activity.id, "name", e.target.value)
                      }
                      placeholder="e.g., River Rafting"
                      required
                    />
                  </div>

                  <div className="space-y-2 text-start">
                    <Label htmlFor={`activity-distance-${activity.id}`}>
                      Distance
                    </Label>
                    <Input
                      id={`activity-distance-${activity.id}`}
                      value={activity.distance}
                      onChange={(e) =>
                        updateActivity(activity.id, "distance", e.target.value)
                      }
                      placeholder="e.g., 8km, 16km"
                    />
                  </div>

                  <div className="space-y-2 text-start">
                    <Label htmlFor={`activity-currency-${activity.id}`}>
                      Currency
                    </Label>
                    <Select
                      value={activity.currency}
                      onValueChange={(value) =>
                        updateActivity(activity.id, "currency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 text-start">
                    <Label htmlFor={`activity-price-${activity.id}`}>
                      Price *
                    </Label>
                    <Input
                      id={`activity-price-${activity.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={activity.price}
                      onChange={(e) =>
                        updateActivity(
                          activity.id,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2 text-start">
                    <Label
                      htmlFor={`activity-discount-percentage-${activity.id}`}
                    >
                      Discount Percentage
                    </Label>
                    <Input
                      id={`activity-discount-percentage-${activity.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={activity.discount_percentage}
                      onChange={(e) => {
                        updateActivity(
                          activity.id,
                          "discount_percentage",
                          parseFloat(e.target.value) || 0
                        );
                        updateActivity(
                          activity.id,
                          "discounted_price",
                          activity.price -
                            (activity.price * parseFloat(e.target.value)) /
                              100 || 0
                        );
                      }}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2 text-start">
                    <section>Discounted Price</section>
                    <section>
                      {" "}
                      {activity.currency}{" "}
                      {activity.price -
                        (activity.price * activity.discount_percentage) / 100 ||
                        0}
                    </section>
                  </div>
                </div>

                {/* Time Slots for this activity */}
                <div className="mt-6 text-start">
                  <Label className="text-sm font-medium">
                    Time Slots for this Activity *
                  </Label>
                  <TimeSlotManager
                    timeSlots={activity.timeSlots}
                    onChange={(newTimeSlots) =>
                      updateActivity(activity.id, "timeSlots", newTimeSlots)
                    }
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-start">
              <Label htmlFor="start_point">Start Point</Label>
              <Input
                id="start_point"
                value={formData.start_point}
                onChange={(e) =>
                  handleInputChange("start_point", e.target.value)
                }
                placeholder="Starting location"
              />
            </div>

            <div className="space-y-2 text-start">
              <Label htmlFor="end_point">End Point</Label>
              <Input
                id="end_point"
                value={formData.end_point}
                onChange={(e) => handleInputChange("end_point", e.target.value)}
                placeholder="Ending location"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Days Open *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllDays}
              >
                {formData.days_open.length === DAYS_OF_WEEK.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.days_open.includes(day)}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <Label htmlFor={day} className="text-sm">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-3 text-start">
              <Label>Images * (Max 10)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload images/videos ({selectedImages.length}/10
                    images, {selectedVideos?.length || 0}/1 video)
                  </span>
                </label>
              </div>

              {/* Video Previews */}
              {videoPreviewUrls.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm mb-2">Video Preview</Label>
                  <div className="grid grid-cols-1 gap-4">
                    {videoPreviewUrls.map((url, index) => (
                      <div key={`video-${index}`} className="relative">
                        <video
                          src={url}
                          controls
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(index, true)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Previews */}
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm mb-2">Image Previews</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(index, false)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <div className="space-y-3 text-start">
              <Label>Add New Images/Videos (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload new images/videos ({selectedImages.length}
                    /10 images, {selectedVideos.length}/1 video)
                  </span>
                </label>
              </div>

              {/* Video Previews */}
              {videoPreviewUrls.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm mb-2">Video Preview</Label>
                  <div className="grid grid-cols-1 gap-4">
                    {videoPreviewUrls.map((url, index) => (
                      <div key={`video-${index}`} className="relative">
                        <video
                          src={url}
                          controls
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(index, true)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Previews */}
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm mb-2">
                    Image Previews {previewUrls.length}
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={`image-${index}`} className="relative">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeMedia(index, false)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isEditing && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" required />
                <Label
                  htmlFor="terms"
                  className="text-sm font-normal cursor-pointer"
                >
                  I agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-0 h-auto text-orange-500 hover:text-orange-600"
                  >
                    Terms & Conditions
                  </a>
                </Label>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={
              loading ||
              (!isEditing && selectedImages.length === 0) ||
              activities.length === 0 ||
              activities.some((activity) => activity.timeSlots.length === 0)
            }
            className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary"
          >
            {loading
              ? isEditing
                ? "Updating Experience..."
                : "Creating Experience..."
              : isEditing
              ? "Update Experience"
              : "Create Experience"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
