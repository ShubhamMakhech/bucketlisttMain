import { DestinationDropdown } from "@/components/DestinationDropdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Upload, X, Clock, Users, Settings } from "lucide-react";
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
  id?: string;
  start_time: string;
  end_time: string;
  capacity: number;
}

interface Activity {
  id: string;
  name: string;
  distance?: string;
  duration: string;
  price: number;
  discount_percentage: number;
  discounted_price: number;
  currency: string;
  timeSlots: TimeSlot[];
  discount_type?: "flat" | "percentage";
  discount_amount?: number;
  b2bPrice?: number;
}

interface AutoGenerateConfig {
  startTime: string;
  endTime: string;
  slotDuration: number;
  capacity: number;
}

interface ExperienceData {
  id: string;
  title: string;
  description: string;
  category_ids: string[];
  location: string;
  location2?: string;
  start_point: string;
  end_point: string;
  days_open: string[];
  destination_id: string;
  activities: Activity[];
  image_urls: string[];
}

interface EditExperienceFormProps {
  initialData: ExperienceData;
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

export function EditExperienceForm({ initialData }: EditExperienceFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  // Auto-generate time slots configuration
  const [autoConfig, setAutoConfig] = useState<AutoGenerateConfig>({
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 2,
    capacity: 10,
  });
  const [showAutoDialog, setShowAutoDialog] = useState<string | null>(null); // Store activity ID instead of boolean
  const [replaceExistingSlots, setReplaceExistingSlots] = useState(false);

  const [formData, setFormData] = useState({
    title: initialData.title,
    description: initialData.description,
    category_ids: initialData.category_ids,
    location: initialData.location,
    location2: initialData.location2 || "",
    start_point: initialData.start_point,
    end_point: initialData.end_point,
    days_open: initialData.days_open,
    destination_id: initialData.destination_id,
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

  useEffect(() => {
    fetchCategories();
    // Initialize activities from initial data
    if (initialData.activities && initialData.activities.length > 0) {
      setActivities(initialData.activities);
    }
    // Initialize preview URLs from existing images
    if (initialData.image_urls && initialData.image_urls.length > 0) {
      setPreviewUrls(initialData.image_urls);
    }
  }, [initialData]);

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

  // Activity Management
  const addActivity = () => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      name: "",
      distance: "",
      duration: "",
      price: 0,
      discount_percentage: 0,
      discounted_price: 0,
      currency: "INR",
      timeSlots: [],
      discount_type: "percentage", // Default to percentage
      discount_amount: 0,
      b2bPrice: 0,
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
    value:
      | string
      | number
      | TimeSlot[]
      | "flat"
      | "percentage"
      | null
      | undefined
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

  // Time Slot Management
  const addTimeSlot = (activityId: string) => {
    const newTimeSlot: TimeSlot = {
      start_time: "",
      end_time: "",
      capacity: 10,
    };

    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? { ...activity, timeSlots: [...activity.timeSlots, newTimeSlot] }
          : activity
      )
    );
  };

  const removeTimeSlot = (activityId: string, slotIndex: number) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              timeSlots: activity.timeSlots.filter(
                (_, index) => index !== slotIndex
              ),
            }
          : activity
      )
    );
  };

  const updateTimeSlot = (
    activityId: string,
    slotIndex: number,
    field: keyof TimeSlot,
    value: string | number
  ) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              timeSlots: activity.timeSlots.map((slot, index) =>
                index === slotIndex ? { ...slot, [field]: value } : slot
              ),
            }
          : activity
      )
    );
  };

  const generateAutoSlots = (activityId: string) => {
    const { startTime, endTime, slotDuration, capacity } = autoConfig;
    const newSlots: TimeSlot[] = [];
    let currentTime = startTime;

    // Convert end time to hours for comparison
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const endTimeInMinutes = endHours * 60 + endMinutes;

    while (currentTime < endTime) {
      const [hours, minutes] = currentTime.split(":").map(Number);
      const currentTimeInMinutes = hours * 60 + minutes;
      const endSlotTimeInMinutes = currentTimeInMinutes + slotDuration * 60;

      if (endSlotTimeInMinutes <= endTimeInMinutes) {
        const endHours = Math.floor(endSlotTimeInMinutes / 60);
        const endMinutes = endSlotTimeInMinutes % 60;
        const endTimeSlot = `${endHours
          .toString()
          .padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

        newSlots.push({
          start_time: currentTime,
          end_time: endTimeSlot,
          capacity,
        });

        currentTime = endTimeSlot;
      } else {
        break;
      }
    }

    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? {
              ...activity,
              timeSlots: replaceExistingSlots
                ? newSlots
                : [...activity.timeSlots, ...newSlots], // Choose to replace or add
            }
          : activity
      )
    );
    setShowAutoDialog(null); // Close dialog by setting to null
  };

  // Image Management
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleImageSelect called", event.target.files);
    const files = Array.from(event.target.files || []);
    const images = files.filter((file) => file.type.startsWith("image/"));

    console.log("Filtered images:", images);

    // Check total images including existing ones
    const totalImages = previewUrls.length + images.length;
    if (totalImages > 10) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 10 images total.",
        variant: "destructive",
      });
      return;
    }

    const newImages = [...selectedImages, ...images];
    setSelectedImages(newImages);

    const newImagePreviewUrls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newImagePreviewUrls]);

    console.log("Images added to state:", {
      newImagesCount: newImages.length,
      newPreviewUrlsCount: newImagePreviewUrls.length,
    });
  };

  const removeImage = (index: number) => {
    const isExistingImage = index < initialData.image_urls.length;

    if (isExistingImage) {
      // Mark existing image for removal
      setRemovedImages((prev) => [...prev, initialData.image_urls[index]]);
    } else {
      // Remove newly selected image
      const newImageIndex = index - initialData.image_urls.length;
      URL.revokeObjectURL(previewUrls[index]);
      setSelectedImages((prev) => prev.filter((_, i) => i !== newImageIndex));
    }

    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (experienceId: string) => {
    console.log("uploadNewImages called with:", {
      experienceId,
      selectedImagesCount: selectedImages.length,
    });

    if (selectedImages.length === 0) {
      console.log("No new images to upload");
      return [];
    }

    const uploadPromises = selectedImages.map(async (file, index) => {
      console.log(`Uploading image ${index + 1}:`, file.name);
      const fileExt = file.name.split(".").pop();
      const fileName = `${experienceId}/${Date.now()}_${index}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("experience-images")
        .upload(fileName, file);

      if (error) {
        console.error("Storage upload error:", error);
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("experience-images").getPublicUrl(fileName);

      console.log("Image uploaded successfully:", publicUrl);

      return {
        image_url: publicUrl,
        display_order: previewUrls.length + index,
        is_primary: false,
        experience_id: experienceId,
      };
    });

    const imageData = await Promise.all(uploadPromises);
    console.log("All images uploaded, inserting into database:", imageData);

    const { error } = await supabase
      .from("experience_images")
      .insert(imageData);

    if (error) {
      console.error("Database insert error:", error);
      throw error;
    }

    console.log("Images successfully inserted into database");
    return imageData.map((img) => img.image_url);
  };

  const removeImagesFromStorage = async () => {
    if (removedImages.length === 0) return;

    for (const imageUrl of removedImages) {
      // Extract file path from URL
      const path = imageUrl.split("/").slice(-2).join("/");

      // Delete from storage
      await supabase.storage.from("experience-images").remove([path]);

      // Delete from database
      await supabase
        .from("experience_images")
        .delete()
        .eq("experience_id", initialData.id)
        .eq("image_url", imageUrl);
    }
  };

  const updateActivities = async (experienceId: string) => {
    // Get all existing activities for this experience
    const { data: existingActivities, error: fetchError } = await supabase
      .from("activities")
      .select("id, name, display_order")
      .eq("experience_id", experienceId)
      .eq("is_active", true)
      .order("display_order");

    if (fetchError) throw fetchError;

    // Separate activities into existing (with UUID) and new (with timestamp ID)
    const existingActivitiesToUpdate = activities.filter(
      (activity) => activity.id.length > 20 // Supabase UUIDs are longer than timestamp IDs
    );
    const newActivitiesToCreate = activities.filter(
      (activity) => activity.id.length <= 20 // Client-side timestamp IDs
    );

    console.log("Activity separation:", {
      total: activities.length,
      existingToUpdate: existingActivitiesToUpdate.length,
      newToCreate: newActivitiesToCreate.length,
      existingIds: existingActivitiesToUpdate.map((a) => a.id),
      newIds: newActivitiesToCreate.map((a) => a.id),
    });

    // Update existing activities
    console.log(
      "🔄 Processing existing activities to update:",
      existingActivitiesToUpdate.map((a) => ({
        id: a.id,
        name: a.name,
        timeSlotsCount: a.timeSlots.length,
      }))
    );

    for (const activity of existingActivitiesToUpdate) {
      console.log(`🔄 Updating activity ${activity.id} (${activity.name}):`, {
        timeSlotsCount: activity.timeSlots.length,
        timeSlots: activity.timeSlots,
      });
      const updateData = {
        name: activity.name,
        distance: activity.distance || null,
        duration: activity.duration,
        price: activity.price,
        discount_percentage: activity.discount_percentage,
        discounted_price: activity.discounted_price,
        currency: activity.currency,
        display_order: activities.indexOf(activity),
        is_active: true,
        b2bPrice: activity.b2bPrice || null,
      };

      const { error: updateError } = await supabase
        .from("activities")
        .update(updateData)
        .eq("id", activity.id);

      if (updateError) throw updateError;

      // Update time slots for this activity
      console.log(
        `⏰ About to update time slots for activity ${activity.id}:`,
        activity.timeSlots
      );
      await updateTimeSlotsForActivity(
        experienceId,
        activity.id,
        activity.timeSlots
      );
      console.log(`✅ Completed time slot update for activity ${activity.id}`);
    }

    // Create new activities
    if (newActivitiesToCreate.length > 0) {
      const newActivitiesData = newActivitiesToCreate.map(
        (activity, index) => ({
          experience_id: experienceId,
          name: activity.name,
          distance: activity.distance || null,
          duration: activity.duration,
          price: activity.price,
          discount_percentage: activity.discount_percentage,
          discounted_price: activity.discounted_price,
          currency: activity.currency,
          display_order: existingActivitiesToUpdate.length + index,
          is_active: true,
          b2bPrice: activity.b2bPrice || null,
        })
      );

      const { data: createdActivities, error: createError } = await supabase
        .from("activities")
        .insert(newActivitiesData)
        .select("*");

      if (createError) throw createError;

      // Create time slots for new activities
      for (let i = 0; i < newActivitiesToCreate.length; i++) {
        const activity = newActivitiesToCreate[i];
        const createdActivity = createdActivities[i];
        await updateTimeSlotsForActivity(
          experienceId,
          createdActivity.id,
          activity.timeSlots
        );
      }
    }

    // Handle deleted activities - mark them as inactive instead of deleting
    const currentActivityIds = existingActivitiesToUpdate.map((a) => a.id);
    const activitiesToDeactivate = (existingActivities || []).filter(
      (existing) => !currentActivityIds.includes(existing.id)
    );

    for (const activityToDeactivate of activitiesToDeactivate) {
      const { error: deactivateError } = await supabase
        .from("activities")
        .update({ is_active: false })
        .eq("id", activityToDeactivate.id);

      if (deactivateError) throw deactivateError;
    }
  };

  const updateTimeSlotsForActivity = async (
    experienceId: string,
    activityId: string,
    newTimeSlots: TimeSlot[]
  ) => {
    console.log(
      `🔧 updateTimeSlotsForActivity called for activity ${activityId}:`,
      {
        experienceId,
        activityId,
        newTimeSlotsCount: newTimeSlots.length,
        newTimeSlots: newTimeSlots,
      }
    );

    // Get existing time slots for this activity
    const { data: existingTimeSlots, error: fetchError } = await supabase
      .from("time_slots")
      .select("id, start_time, end_time, capacity")
      .eq("activity_id", activityId);

    if (fetchError) throw fetchError;

    console.log(
      `📋 Existing time slots for activity ${activityId}:`,
      existingTimeSlots
    );

    // Check which time slots have bookings
    const timeSlotIds = existingTimeSlots?.map((ts) => ts.id) || [];
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("time_slot_id")
      .in("time_slot_id", timeSlotIds);

    if (bookingsError) throw bookingsError;

    // Get time slot IDs that have bookings
    const bookedTimeSlotIds = new Set(
      bookingsData?.map((b) => b.time_slot_id) || []
    );

    // Separate time slots with bookings from those without
    const timeSlotsWithBookings =
      existingTimeSlots?.filter((ts) => bookedTimeSlotIds.has(ts.id)) || [];
    const timeSlotsWithoutBookings =
      existingTimeSlots?.filter((ts) => !bookedTimeSlotIds.has(ts.id)) || [];

    // Only delete time slots that don't have bookings AND are not in the new time slots list
    const timeSlotsToKeep = timeSlotsWithoutBookings.filter((existingSlot) =>
      newTimeSlots.some(
        (newSlot) =>
          newSlot.start_time === existingSlot.start_time &&
          newSlot.end_time === existingSlot.end_time
      )
    );

    const timeSlotsToDelete = timeSlotsWithoutBookings.filter(
      (existingSlot) =>
        !newTimeSlots.some(
          (newSlot) =>
            newSlot.start_time === existingSlot.start_time &&
            newSlot.end_time === existingSlot.end_time
        )
    );

    console.log(
      "🗑️ Time slot deletion analysis for activity",
      activityId,
      ":",
      {
        timeSlotsWithoutBookings: timeSlotsWithoutBookings.length,
        timeSlotsToKeep: timeSlotsToKeep.length,
        timeSlotsToDelete: timeSlotsToDelete.length,
        timeSlotsToDeleteIds: timeSlotsToDelete.map((ts) => ts.id),
        timeSlotsToDeleteDetails: timeSlotsToDelete,
      }
    );

    if (timeSlotsToDelete.length > 0) {
      const timeSlotIdsToDelete = timeSlotsToDelete.map((ts) => ts.id);
      console.log(
        "🚨 DELETING time slots for activity",
        activityId,
        ":",
        timeSlotIdsToDelete
      );

      const { error: deleteError } = await supabase
        .from("time_slots")
        .delete()
        .in("id", timeSlotIdsToDelete);

      if (deleteError) {
        console.error("❌ Delete error:", deleteError);
        throw deleteError;
      }

      console.log(
        "✅ Successfully deleted time slots for activity",
        activityId
      );
    } else {
      console.log("ℹ️ No time slots to delete for activity", activityId);
    }

    // Update existing time slots that have bookings (if they match new slots)
    for (const existingSlot of timeSlotsWithBookings) {
      const matchingNewSlot = newTimeSlots.find(
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

        if (updateSlotError) throw updateSlotError;
      }
    }

    // Update existing time slots that we're keeping (no bookings, but match new slots)
    for (const existingSlot of timeSlotsToKeep) {
      const matchingNewSlot = newTimeSlots.find(
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

        if (updateSlotError) throw updateSlotError;
      }
    }

    // Create new time slots that don't match ANY existing ones
    const allExistingTimeSlots = [
      ...timeSlotsWithBookings,
      ...timeSlotsToKeep, // Include slots we're keeping
    ];
    const newTimeSlotsToCreate = newTimeSlots.filter(
      (newSlot) =>
        !allExistingTimeSlots.some(
          (existingSlot) =>
            existingSlot.start_time === newSlot.start_time &&
            existingSlot.end_time === newSlot.end_time
        )
    );

    console.log("New time slots to create:", {
      newTimeSlotsToCreateCount: newTimeSlotsToCreate.length,
      newTimeSlotsToCreate: newTimeSlotsToCreate,
    });

    if (newTimeSlotsToCreate.length > 0) {
      const timeSlotData = newTimeSlotsToCreate.map((slot) => ({
        experience_id: experienceId,
        activity_id: activityId,
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: slot.capacity,
      }));

      const { error: createError } = await supabase
        .from("time_slots")
        .insert(timeSlotData);

      if (createError) throw createError;
    }
  };

  const updateExperienceCategories = async (
    experienceId: string,
    categoryIds: string[]
  ) => {
    // Delete existing category associations
    const { error: deleteError } = await supabase
      .from("experience_categories")
      .delete()
      .eq("experience_id", experienceId);

    if (deleteError) throw deleteError;

    // Create new associations
    if (categoryIds.length > 0) {
      const experienceCategoriesData = categoryIds.map((categoryId) => ({
        experience_id: experienceId,
        category_id: categoryId,
      }));

      const { error } = await supabase
        .from("experience_categories")
        .insert(experienceCategoriesData);

      if (error) throw error;
    }
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
      let queryBuilder = supabase
        .from("experiences")
        .select("id")
        .eq("url_name", urlName)
        .limit(1);

      if (excludeId) {
        queryBuilder = queryBuilder.neq("id", excludeId);
      }

      const { data } = await queryBuilder;

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
        description: "Please sign in to update the experience.",
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

    if (invalidActivities.length > 0) {
      toast({
        title: "Invalid activity data",
        description:
          "Please ensure all activities have valid name, duration, price, and discount percentage.",
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

      // Generate unique url_name from title (update if title changed)
      const baseUrlName = generateUrlName(formData.title);
      const uniqueUrlName = await ensureUniqueUrlName(
        baseUrlName,
        initialData.id
      );

      const experienceData = {
        title: formData.title,
        description: formData.description,
        category: primaryCategory?.name || "General",
        price: minPrice,
        discount_percentage: minDiscountPercentage,
        currency: activities.length > 0 ? activities[0].currency : "INR",
        location: formData.location,
        location2: formData.location2,
        start_point: formData.start_point,
        end_point: formData.end_point,
        days_open: formData.days_open,
        destination_id: formData.destination_id,
        url_name: uniqueUrlName, // Add url_name field
      };

      // Update experience
      const { error: experienceError } = await supabase
        .from("experiences")
        .update(experienceData)
        .eq("id", initialData.id);

      if (experienceError) throw experienceError;

      // Handle image updates
      console.log("Starting image updates...", {
        removedImagesCount: removedImages.length,
        selectedImagesCount: selectedImages.length,
        previewUrlsCount: previewUrls.length,
      });

      await removeImagesFromStorage();
      const newImageUrls = await uploadNewImages(initialData.id);

      console.log("Image updates completed:", { newImageUrls });

      // Update primary image if we have images
      if (previewUrls.length > 0) {
        const primaryImageUrl = previewUrls[0];
        const { error: updateError } = await supabase
          .from("experiences")
          .update({ image_url: primaryImageUrl })
          .eq("id", initialData.id);

        if (updateError) throw updateError;
      }

      // Update activities and time slots
      await updateActivities(initialData.id);

      // Update categories
      await updateExperienceCategories(initialData.id, formData.category_ids);

      // Invalidate relevant queries to refresh cached data
      queryClient.invalidateQueries({
        queryKey: ["experience", initialData.id],
      });
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-experiences"] });
      queryClient.invalidateQueries({
        queryKey: ["activities", initialData.id],
      });

      toast({
        title: "Experience updated successfully!",
        description: "Your experience has been updated.",
      });

      navigate("/profile");
    } catch (error) {
      console.error("Error updating experience:", error);
      toast({
        title: "Error updating experience",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  console.log("formData", activities, activities.length);
  return (
    <Card className="max-w-4xl mx-auto border-2 border-brand-primary rounded-xl">
      <CardHeader>
        <CardTitle>Edit Experience</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
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
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
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

          {/* Location */}
          <div className="space-y-2 text-start">
            <Label htmlFor="location">Google Maps Link *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              required
              placeholder="Paste Google Maps link to meeting point/location"
            />
          </div>

          {/* Location 2 */}
          <div className="space-y-2 text-start">
            <Label htmlFor="location2">Google Maps Link 2 (Optional)</Label>
            <Input
              id="location2"
              value={formData.location2}
              onChange={(e) => handleInputChange("location2", e.target.value)}
              placeholder="Paste second Google Maps link (e.g., end point/drop-off location)"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add a second location (e.g., end point or drop-off
              location)
            </p>
          </div>

          {/* Destination */}
          <div className="text-start">
            <DestinationDropdown
              value={formData.destination_id}
              onValueChange={(value) =>
                handleInputChange("destination_id", value)
              }
              required={true}
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                    <Label htmlFor={`activity-duration-${activity.id}`}>
                      Duration
                    </Label>
                    <Input
                      id={`activity-duration-${activity.id}`}
                      value={activity.duration}
                      onChange={(e) =>
                        updateActivity(activity.id, "duration", e.target.value)
                      }
                      placeholder="e.g., 2 hours"
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
                    <Label>Discounted Price</Label>
                    <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-gray-50">
                      <span className="text-sm text-gray-600">
                        {activity.currency}{" "}
                        {activity.discounted_price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-start">
                    <Label htmlFor={`activity-b2b-price-${activity.id}`}>
                      B2B Price (Optional)
                    </Label>
                    <Input
                      id={`activity-b2b-price-${activity.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={activity.b2bPrice || ""}
                      onChange={(e) =>
                        updateActivity(
                          activity.id,
                          "b2bPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      B2B price for agent bookings (optional)
                    </p>
                  </div>
                </div>

                {/* Time Slots for this activity */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">
                      Time Slots for this Activity *
                    </Label>
                    <div className="flex gap-2">
                      <Dialog
                        open={showAutoDialog === activity.id}
                        onOpenChange={(open) =>
                          setShowAutoDialog(open ? activity.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            Auto Generate
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Configure Auto-Generate Settings
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="auto-start-time">
                                  Start Time
                                </Label>
                                <Input
                                  id="auto-start-time"
                                  type="time"
                                  value={autoConfig.startTime}
                                  onChange={(e) =>
                                    setAutoConfig((prev) => ({
                                      ...prev,
                                      startTime: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="auto-end-time">End Time</Label>
                                <Input
                                  id="auto-end-time"
                                  type="time"
                                  value={autoConfig.endTime}
                                  onChange={(e) =>
                                    setAutoConfig((prev) => ({
                                      ...prev,
                                      endTime: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="slot-duration">
                                Slot Duration (hours)
                              </Label>
                              <Input
                                id="slot-duration"
                                type="number"
                                min="0.5"
                                max="8"
                                step="0.5"
                                value={autoConfig.slotDuration}
                                onChange={(e) =>
                                  setAutoConfig((prev) => ({
                                    ...prev,
                                    slotDuration:
                                      parseFloat(e.target.value) || 1,
                                  }))
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="auto-capacity">
                                Capacity per Slot
                              </Label>
                              <Input
                                id="auto-capacity"
                                type="number"
                                min="1"
                                value={autoConfig.capacity}
                                onChange={(e) =>
                                  setAutoConfig((prev) => ({
                                    ...prev,
                                    capacity: parseInt(e.target.value) || 1,
                                  }))
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="replace-slots"
                                  checked={replaceExistingSlots}
                                  onCheckedChange={(checked) =>
                                    setReplaceExistingSlots(checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor="replace-slots"
                                  className="text-sm"
                                >
                                  Replace existing time slots
                                </Label>
                              </div>
                              <p className="text-xs text-muted-foreground ml-6">
                                {replaceExistingSlots
                                  ? "This will remove all existing time slots and create new ones."
                                  : "This will add new time slots to existing ones."}
                              </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => setShowAutoDialog(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => generateAutoSlots(activity.id)}
                              >
                                Generate Slots
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(activity.id)}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        Add Time Slot
                      </Button>
                    </div>
                  </div>

                  {activity.timeSlots.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                      No time slots added yet. Click "Add Time Slot" or use
                      "Auto Generate" to get started.
                    </div>
                  )}

                  {activity.timeSlots.map((slot, slotIndex) => (
                    <div
                      key={slotIndex}
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 border rounded-lg mb-2"
                    >
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) =>
                            updateTimeSlot(
                              activity.id,
                              slotIndex,
                              "start_time",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) =>
                            updateTimeSlot(
                              activity.id,
                              slotIndex,
                              "end_time",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Capacity</Label>
                        <div className="relative">
                          <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            min="1"
                            value={slot.capacity}
                            onChange={(e) =>
                              updateTimeSlot(
                                activity.id,
                                slotIndex,
                                "capacity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeSlot(activity.id, slotIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Location Details */}
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

          {/* Days Open */}
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

          {/* Image Management */}
          <div className="space-y-3 text-start">
            <Label>Images ({previewUrls.length}/10)</Label>

            {/* Upload new images */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                accept="image/*"
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
                  Click to upload new images ({selectedImages.length} selected)
                </span>
              </label>
            </div>

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
                        onClick={() => removeImage(index)}
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

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={
              loading ||
              activities.length === 0 ||
              activities.some((activity) => activity.timeSlots.length === 0)
            }
            className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary"
          >
            {loading ? "Updating Experience..." : "Update Experience"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
