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
import "react-quill/dist/quill.snow.css";
import { AutoHeightQuill } from "@/components/AutoHeightQuill";

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
  discount_type?: "flat" | "percentage"; // UI-only field, not saved to DB
  discount_amount?: number; // For flat discount, UI-only field
}

interface ExperienceData {
  discounted_price: number;
  id?: string;
  title: string;
  description: string;
  highlights?: string;
  inclusion?: string;
  exclusion?: string;
  eligibility?: string;
  location_info?: string;
  cancellation_policy?: string;
  operating_hours?: string;
  faqs?: string;
  category_ids: string[];
  original_price: number;
  discount_percentage: number | null;
  currency: string;
  duration: string;
  group_size: string;
  location: string;
  location2: string;
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
    logo_url?: string;
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
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    highlights: initialData?.highlights || "",
    inclusion: initialData?.inclusion || "",
    exclusion: initialData?.exclusion || "",
    eligibility: initialData?.eligibility || "",
    location_info: initialData?.location_info || "",
    cancellation_policy: initialData?.cancellation_policy || "",
    operating_hours: initialData?.operating_hours || "",
    faqs: initialData?.faqs || "",
    category_ids: initialData?.category_ids || [],
    location: initialData?.location || "",
    location2: initialData?.location2 || "",
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
    // Set logo preview if editing
    if (initialData?.logo_url) {
      setLogoPreviewUrl(initialData.logo_url);
    }
  }, [initialData]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Load existing activities when editing
  useEffect(() => {
    if (isEditing && initialData) {
      if (initialData.activities && initialData.activities.length > 0) {
        // Experience has activities - use them, ensure discount_type is set
        const activitiesWithDefaults = initialData.activities.map(
          (activity) => ({
            ...activity,
            discount_type: activity.discount_type || "percentage",
            discount_amount: activity.discount_amount || 0,
          })
        );
        setActivities(activitiesWithDefaults);
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
          discount_type: "percentage",
          discount_amount: 0,
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
      discount_type: "percentage",
      discount_amount: 0,
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
          // Auto-calculate discounted price when discount changes
          if (
            field === "discount_percentage" ||
            field === "price" ||
            field === "discount_amount" ||
            field === "discount_type"
          ) {
            const discountType =
              field === "discount_type"
                ? (value as "flat" | "percentage")
                : activity.discount_type || "percentage";
            const price =
              typeof value === "number" && field === "price"
                ? value
                : activity.price;

            if (discountType === "flat") {
              let discountAmount: number;
              if (field === "discount_amount" && typeof value === "number") {
                discountAmount = value;
              } else if (
                field === "discount_type" &&
                (activity.discount_amount === undefined ||
                  activity.discount_amount === 0) &&
                activity.discount_percentage
              ) {
                // Switching to flat: calculate amount from percentage
                discountAmount = (price * activity.discount_percentage) / 100;
                updated.discount_amount = discountAmount;
              } else {
                discountAmount = activity.discount_amount || 0;
              }
              updated.discounted_price = Math.max(0, price - discountAmount);
              // Convert flat discount to percentage for storage
              updated.discount_percentage =
                price > 0 ? (discountAmount / price) * 100 : 0;
            } else {
              let discount: number;
              if (
                field === "discount_percentage" &&
                typeof value === "number"
              ) {
                discount = value;
              } else if (
                field === "discount_type" &&
                (!activity.discount_percentage ||
                  activity.discount_percentage === 0) &&
                activity.discount_amount
              ) {
                // Switching to percentage: calculate percentage from amount
                discount =
                  price > 0 ? (activity.discount_amount / price) * 100 : 0;
                updated.discount_percentage = discount;
              } else {
                discount = activity.discount_percentage || 0;
              }
              updated.discounted_price = price - (price * discount) / 100;
            }
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

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file for the logo.",
        variant: "destructive",
      });
      return;
    }

    // Revoke old preview URL if it was a blob
    if (logoPreviewUrl && logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setSelectedLogo(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(previewUrl);
  };

  const removeLogo = () => {
    if (logoPreviewUrl && logoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setSelectedLogo(null);
    setLogoPreviewUrl(null);
  };

  const uploadLogo = async (experienceId: string): Promise<string | null> => {
    if (!selectedLogo) return null;

    const fileExt = selectedLogo.name.split(".").pop();
    const fileName = `${experienceId}/logo_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("experience-images")
      .upload(fileName, selectedLogo);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("experience-images").getPublicUrl(fileName);

    return publicUrl;
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

  // Helper function to generate URL-friendly name from title
  const generateUrlName = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Helper function to ensure unique url_name
  const ensureUniqueUrlName = async (
    baseUrlName: string,
    excludeId?: string
  ): Promise<string> => {
    let urlName = baseUrlName;
    let counter = 1;

    while (true) {
      let query = supabase
        .from("experiences")
        .select("id")
        .eq("url_name", urlName)
        .limit(1);

      // If editing, exclude current experience from check
      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data } = await query;

      if (!data || data.length === 0) {
        // URL name is unique
        return urlName;
      }

      // URL name exists, append counter
      urlName = `${baseUrlName}-${counter}`;
      counter++;
    }
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

      // Generate unique url_name from title
      const baseUrlName = generateUrlName(formData.title);
      const uniqueUrlName = await ensureUniqueUrlName(
        baseUrlName,
        isEditing ? initialData?.id : undefined
      );

      const experienceData = {
        title: formData.title,
        description: formData.description,
        highlights: formData.highlights || null,
        inclusion: formData.inclusion || null,
        exclusion: formData.exclusion || null,
        eligibility: formData.eligibility || null,
        location_info: formData.location_info || null,
        cancellation_policy: formData.cancellation_policy || null,
        operating_hours: formData.operating_hours || null,
        faqs: formData.faqs || null,
        category: primaryCategory?.name || "General", // Legacy field - use first selected category
        price: minPrice,
        discount_percentage: minDiscountPercentage,
        original_price: null, // No longer used
        currency: activities.length > 0 ? activities[0].currency : "INR", // Use first activity's currency
        duration: null, // Legacy field - no longer used
        group_size: null, // Legacy field - no longer used
        location: formData.location,
        location2: formData.location2,
        start_point: formData.start_point,
        end_point: formData.end_point,
        distance_km: 0, // Legacy field - kept for compatibility
        days_open: formData.days_open,
        vendor_id: user.id,
        destination_id: formData.destination_id,
        url_name: uniqueUrlName, // Add url_name field
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

        // Upload logo if selected
        const logoUrl = await uploadLogo(initialData.id);

        // Upload new images if any
        const primaryImageUrl =
          selectedImages.length > 0
            ? await uploadImages(initialData.id)
            : null;

        // Update experience with logo and/or primary image
        const updateData: any = {};
        if (logoUrl) {
          updateData.logo_url = logoUrl;
        }
        if (primaryImageUrl) {
          updateData.image_url = primaryImageUrl;
        }
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from("experiences")
            .update(updateData)
            .eq("id", initialData.id)
            .eq("is_active", true);

          if (updateError) throw updateError;
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

        // Upload logo if selected
        const logoUrl = await uploadLogo(experience.id);

        // Upload images and get primary image URL
        const primaryImageUrl = await uploadImages(experience.id);

        // Update the experience with the primary image URL and logo
        const updateData: any = {};
        if (primaryImageUrl) {
          updateData.image_url = primaryImageUrl;
        }
        if (logoUrl) {
          updateData.logo_url = logoUrl;
        }
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from("experiences")
            .update(updateData)
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
            <AutoHeightQuill
              theme="snow"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Describe the experience.."
              minHeight={160}
            />
          </div>

          <div className="space-y-2 text-start">
            <Label htmlFor="highlights">Highlights</Label>
            <AutoHeightQuill
              theme="snow"
              value={formData.highlights}
              onChange={(value) => handleInputChange("highlights", value)}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Key highlights of the experience.."
              minHeight={72}
            />
          </div>
          <div className="space-y-2 text-start">
            <Label htmlFor="inclusion">Inclusion</Label>
            <AutoHeightQuill
              theme="snow"
              value={formData.inclusion}
              onChange={(value) => handleInputChange("inclusion", value)}
              modules={quillModules}
              formats={quillFormats}
              placeholder="What's included.."
              minHeight={72}
            />
          </div>
          <div className="space-y-2 text-start">
            <Label htmlFor="exclusion">Exclusion</Label>
            <AutoHeightQuill
              theme="snow"
              value={formData.exclusion}
              onChange={(value) => handleInputChange("exclusion", value)}
              modules={quillModules}
              formats={quillFormats}
              placeholder="What's not included.."
              minHeight={72}
            />
          </div>
          <div className="space-y-2 text-start">
            <Label htmlFor="eligibility">Eligibility</Label>
            <AutoHeightQuill
              theme="snow"
              value={formData.eligibility}
              onChange={(value) => handleInputChange("eligibility", value)}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Who can participate.."
              minHeight={72}
            />
          </div>
          <div className="space-y-2 text-start">
            <Label htmlFor="location_info">Location (details)</Label>
            <AutoHeightQuill
              theme="snow"
              value={formData.location_info}
              onChange={(value) => handleInputChange("location_info", value)}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Location details and how to reach.."
              minHeight={72}
            />
          </div>
          <div className="space-y-2 text-start">
            <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
            <AutoHeightQuill
              theme="snow"
              value={formData.cancellation_policy}
              onChange={(value) =>
                handleInputChange("cancellation_policy", value)
              }
              modules={quillModules}
              formats={quillFormats}
              placeholder="Cancellation and refund policy.."
              minHeight={72}
            />
          </div>
          <div className="space-y-2 text-start">
            <Label htmlFor="operating_hours">Operating Hours</Label>
            <AutoHeightQuill
              theme="snow"
              value={formData.operating_hours}
              onChange={(value) => handleInputChange("operating_hours", value)}
              modules={quillModules}
              formats={quillFormats}
              placeholder="When is this experience available.."
              minHeight={72}
            />
          </div>
          <div className="space-y-2 text-start">
            <Label htmlFor="faqs">FAQs</Label>
            <AutoHeightQuill
              theme="snow"
              value={formData.faqs}
              onChange={(value) => handleInputChange("faqs", value)}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Frequently asked questions.."
              minHeight={72}
            />
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

          <div className="space-y-2 text-start">
            <Label htmlFor="location2">Google Maps Link 2 (Optional)</Label>
            <Input
              id="location2"
              value={formData.location2}
              onChange={(e) => handleInputChange("location2", e.target.value)}
              placeholder="Paste second Google Maps link (e.g., end point/drop-off location)"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add a second location (e.g., end point or drop-off location)
            </p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    <Label htmlFor={`activity-discount-type-${activity.id}`}>
                      Discount Type
                    </Label>
                    <Select
                      value={activity.discount_type || "percentage"}
                      onValueChange={(value) =>
                        updateActivity(
                          activity.id,
                          "discount_type",
                          value as "flat" | "percentage"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          Percentage (%)
                        </SelectItem>
                        <SelectItem value="flat">Flat Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 text-start">
                    <Label htmlFor={`activity-discount-${activity.id}`}>
                      {activity.discount_type === "flat"
                        ? "Discount Amount"
                        : "Discount Percentage"}
                    </Label>
                    {activity.discount_type === "flat" ? (
                      <Input
                        id={`activity-discount-${activity.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        max={activity.price}
                        value={activity.discount_amount || 0}
                        onChange={(e) => {
                          updateActivity(
                            activity.id,
                            "discount_amount",
                            parseFloat(e.target.value) || 0
                          );
                        }}
                        placeholder="0.00"
                      />
                    ) : (
                      <Input
                        id={`activity-discount-${activity.id}`}
                        type="number"
                        min="0"
                        max="100"
                        value={activity.discount_percentage || 0}
                        onChange={(e) => {
                          updateActivity(
                            activity.id,
                            "discount_percentage",
                            parseFloat(e.target.value) || 0
                          );
                        }}
                        placeholder="0.00"
                      />
                    )}
                  </div>

                  <div className="space-y-2 text-start">
                    <Label>Final Price</Label>
                    <div className="text-lg font-semibold">
                      {activity.currency} {activity.discounted_price.toFixed(2)}
                    </div>
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

          {/* Logo Upload Section */}
          <div className="space-y-3 text-start">
            <Label>Logo {isEditing ? "(Optional)" : ""}</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload logo
                </span>
              </label>
            </div>

            {/* Logo Preview */}
            {logoPreviewUrl && (
              <div className="mt-4">
                <Label className="text-sm mb-2">Logo Preview</Label>
                <div className="relative inline-block">
                  <img
                    src={logoPreviewUrl}
                    alt="Logo preview"
                    className="w-32 h-32 object-contain rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
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
