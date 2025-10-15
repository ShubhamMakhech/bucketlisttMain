import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Eye,
  IndianRupee,
  MapPin,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const convertToINR = (usdAmount: number) => {
  return usdAmount;
};

const VendorExperiences = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["vendor-experiences", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
  console.log(experiences);
  const { data: experienceStats } = useQuery({
    queryKey: ["experience-stats", user?.id],
    queryFn: async () => {
      if (!user || !experiences) return {};
      const stats: Record<string, any> = {};

      for (const experience of experiences) {
        const { data: bookings } = await supabase
          .from("bookings")
          .select("*")
          .eq("experience_id", experience.id)
          .eq("status", "confirmed");

        const totalBookings = bookings?.length || 0;
        const totalRevenue =
          bookings?.reduce(
            (sum, booking) =>
              sum + Number(experience.price) * booking.total_participants,
            0
          ) || 0;

        stats[experience.id] = {
          totalBookings,
          totalRevenue: convertToINR(totalRevenue),
          averageRating: experience.rating || 0,
        };
      }
      return stats;
    },
    enabled: !!user && !!experiences,
  });

  // Mutation for managing experience status
  const manageExperienceMutation = useMutation({
    mutationFn: async ({
      experienceId,
      action,
    }: {
      experienceId: string;
      action: "toggle";
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "manage-experience",
        {
          body: { experienceId, action },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch the experiences query
      queryClient.invalidateQueries({
        queryKey: ["vendor-experiences", user?.id],
      });
    },
    onError: (error) => {
      console.error("Error managing experience:", error);
    },
  });

  const handleToggleStatus = (experienceId: string) => {
    manageExperienceMutation.mutate({ experienceId, action: "toggle" });
  };

  if (experiencesLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pb-8 pt-4 space-y-4  text-start">
        <div className=" test-start">
          <Button
            variant="ghost"
            onClick={() => navigate("/profile")}
            className="mb-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
        </div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 text-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Experiences
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Easily manage, track, and compare your experience listings
            </p>
          </div>
          <Button
            onClick={() => navigate("/create-experience")}
            className="flex items-center gap-2"
            style={{ background: "var(--brand-color)" }}
          >
            <Plus className="h-4 w-4" />
            Create New Experience
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* keep the same cards as before */}
          {/* ... */}
        </div>

        {/* Table View for Experiences */}
        {experiences && experiences.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr className="text-left text-sm font-semibold">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Bookings</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {experiences.map((experience) => {
                  const stats = experienceStats?.[experience.id] || {
                    totalBookings: 0,
                    totalRevenue: 0,
                    averageRating: 0,
                  };

                  return (
                    <tr
                      key={experience.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition text-start"
                    >
                      <td className="px-4 py-3 font-medium">
                        {experience.title}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{experience.category}</Badge>
                      </td>
                      <td className="px-4 py-3">{experience.location}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        ₹{Number(experience.price).toFixed(0)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            Boolean((experience as any).is_active)
                              ? "default"
                              : "secondary"
                          }
                          className={
                            Boolean((experience as any).is_active)
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {Boolean((experience as any).is_active)
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{stats.totalBookings}</td>
                      <td className="px-4 py-3 text-blue-600">
                        ₹{stats.totalRevenue.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {experience.rating || "0.0"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {format(
                          new Date(experience.created_at),
                          "MMM dd, yyyy"
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const experienceName = experience.title
                                .toLowerCase()
                                .replace(/[^a-z0-9\s-]/g, "")
                                .replace(/\s+/g, "-")
                                .replace(/-+/g, "-")
                                .trim();
                              navigate(`/experience/${experienceName}`, {
                                state: {
                                  experienceData: experience,
                                  fromPage: "vendor-experiences",
                                  timestamp: Date.now(),
                                },
                              });
                            }}
                            title="View Experience"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/edit-experience/${experience.id}`)
                            }
                            title="Edit Experience"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={Boolean((experience as any).is_active)}
                            onCheckedChange={() =>
                              handleToggleStatus(experience.id)
                            }
                            title={
                              Boolean((experience as any).is_active)
                                ? "Deactivate"
                                : "Activate"
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-10 w-10 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500">No experiences yet</p>
            <Button
              className="mt-4"
              onClick={() => navigate("/create-experience")}
            >
              Create Your First Experience
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorExperiences;
