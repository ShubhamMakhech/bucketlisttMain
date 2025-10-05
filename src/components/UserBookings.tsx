"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BookingWithDueAmount {
  due_amount?: number;
  [key: string]: any;
}

export const UserBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "booking_date", desc: true }, // default sort
  ]);
  const [showTodayOnly, setShowTodayOnly] = React.useState(false);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["user-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // console.log("user", user);
      if (user.user_metadata.role === "vendor") {
        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
          *,
          experiences (
            id,
            title,
            location,
            price,
            currency,
            vendor_id
          ),
          time_slots (
            id,
            start_time,
            end_time,
            activity_id,
            activities (
              id,
              name,
              price,
              currency
            )
          ),
          booking_participants (
            name,
            email,
            phone_number
          )
        `
          )
          .eq("experiences.vendor_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
          *,
          experiences (
            id,
            title,
            location,
            price,
            currency
          ),
          time_slots (
            id,
            start_time,
            end_time,
            activity_id,
            activities (
              id,
              name,
              price,
              currency
            )
          ),
          booking_participants (
            name,
            email,
            phone_number
          )
        `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      }
    },
    enabled: !!user,
  });

  // Fetch profiles for all unique user_ids from bookings
  const uniqueUserIds = React.useMemo(() => {
    const userIds = bookings.map((booking) => booking.user_id).filter(Boolean);
    // console.log("All bookings:", bookings);
    // console.log(
      // "All user_ids from bookings:",
      // bookings.map((b) => b.user_id)
    // );
    // console.log("Filtered user_ids:", userIds);
    // console.log("Unique user_ids:", [...new Set(userIds)]);

    // TEMPORARY: Add your own user ID for testing if no bookings exist
    const uniqueIds = [...new Set(userIds)];
    if (uniqueIds.length === 0 && user?.id) {
      // console.log(
        // "No user IDs from bookings, adding current user ID for testing:",
        // user.id
      // );
      return [user.id];
    }

    return uniqueIds;
  }, [bookings, user]);

  const { data: profiles = [] } = useQuery({
    queryKey: ["user-profiles", uniqueUserIds],
    queryFn: async () => {
      // console.log("Profile query triggered with uniqueUserIds:", uniqueUserIds);
      if (uniqueUserIds.length === 0) {
        // console.log("No unique user IDs, returning empty array");
        return [];
      }
      // console.log("uniqueUserIds", uniqueUserIds);
      // console.log("Current user:", user);
      // console.log("User role:", user?.user_metadata?.role);

      // Try to fetch profiles one by one to debug RLS issues
      const profilePromises = uniqueUserIds.map(async (userId) => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId);

          if (error) {
            // console.log(`Error fetching profile for user ${userId}:`, error);
            return null;
          }

          // Return the first profile if found, otherwise null
          return data && data.length > 0 ? data[0] : null;
        } catch (err) {
          // console.log(`Exception fetching profile for user ${userId}:`, err);
          return null;
        }
      });

      const results = await Promise.all(profilePromises);
      const validProfiles = results.filter(Boolean);

      // console.log("Fetched profiles:", validProfiles);
      return validProfiles;
    },
    enabled: uniqueUserIds.length > 0,
  });

  // Create a map of user_id to profile for easy lookup
  const profileMap = React.useMemo(() => {
    return profiles.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, any>);
  }, [profiles]);

  // Filter today's bookings
  const filteredBookings = React.useMemo(() => {
    if (showTodayOnly) {
      return bookings.filter((booking) =>
        isSameDay(new Date(booking.booking_date), new Date())
      );
    }
    return bookings;
  }, [bookings, showTodayOnly]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const columns = React.useMemo<ColumnDef<BookingWithDueAmount>[]>(
    () => [
      {
        accessorKey: "index",
        header: "No.",
        cell: ({ row }) => row.index + 1,
      },
      {
        accessorKey: "experiences.title",
        header: "Title",
        cell: ({ row }) => (
          <span
            className="cursor-pointer hover:text-brand-primary"
            onClick={() =>
              navigate(`/experience/${row.original.experiences?.id}`)
            }
          >
            {row.original.experiences?.title}
          </span>
        ),
      },
      {
        accessorKey: "time_slots.activities.name",
        header: "Activity",
        cell: ({ row }) => row.original.time_slots?.activities?.name || "N/A",
      },
      {
        accessorKey: "booking_date",
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const sortIcon =
            isSorted === "asc" ? "↑" : isSorted === "desc" ? "↓" : "↓";

          return (
            <div
              className="cursor-pointer"
              onClick={() => column.toggleSorting(isSorted === "asc")}
            >
              Activity Date {sortIcon}
            </div>
          );
        },
        cell: ({ row }) =>
          format(new Date(row.original.booking_date), "MMM d, yyyy"),
        sortingFn: (a, b) => {
          const dateA = new Date(a.original.booking_date).getTime();
          const dateB = new Date(b.original.booking_date).getTime();
          return dateA - dateB;
        },
      },
      {
        accessorKey: "experiences.location",
        header: "Location",
        cell: ({ row }) => (
          <a
            href={row.original.experiences?.location}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-primary"
          >
            {row.original.experiences?.location}
          </a>
        ),
      },
      {
        accessorKey: "profiles.first_name",
        header: "Customer Name",
        cell: ({ row }) => {
          const profile = profileMap[row.original.user_id];
          if (profile) {
            return `${profile.first_name} ${profile.last_name}`.trim();
          }
          return row.original?.booking_participants?.[0]?.name || "N/A";
        },
      },
      {
        accessorKey: "profiles.email",
        header: "Customer Email",
        cell: ({ row }) => {
          const profile = profileMap[row.original.user_id];
          return (
            profile?.email ||
            row.original?.booking_participants?.[0]?.email ||
            "N/A"
          );
        },
      },
      {
        accessorKey: "profiles.phone_number",
        header: "Contact Number",
        cell: ({ row }) => {
          const profile = profileMap[row.original.user_id];
          return (
            profile?.phone_number ||
            row.original?.booking_participants?.[0]?.phone_number ||
            "N/A"
          );
        },
      },
      // {
      //   accessorKey: "profiles.profile_picture_url",
      //   header: "Profile Picture",
      //   cell: ({ row }) => {
      //     const profile = profileMap[row.original.user_id];
      //     if (profile?.profile_picture_url) {
      //       return (
      //         <img
      //           src={profile.profile_picture_url}
      //           alt={`${profile.first_name} ${profile.last_name}`}
      //           className="w-8 h-8 rounded-full object-cover"
      //         />
      //       );
      //     }
      //     return (
      //       <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
      //         {profile
      //           ? `${profile.first_name?.[0] || ""}${
      //               profile.last_name?.[0] || ""
      //             }`
      //           : "N/A"}
      //       </div>
      //     );
      //   },
      // },
      {
        accessorKey: "total_participants",
        header: "No. of Participants",
        cell: ({ row }) => row.original?.total_participants || "N/A",
      },
      {
        accessorKey: "price",
        header: "Total Amount",
        cell: ({ row }) => {
          //  console.log("row.original", row.original);
          const activity = row.original.time_slots?.activities;
          const price =
            activity?.price || row.original?.experiences?.price || 0;
          const currency =
            activity?.currency || row.original?.experiences?.currency || "INR";
          const totalAmount = price * row.original?.total_participants;
          const dueAmount = row.original?.due_amount || 0;
          const paidAmount = totalAmount - dueAmount;
          const bookingAmount = row.original?.booking_amount || "N/A";

          return (
            <div>
              <div className="text-lg font-bold text-orange-500 mb-1">
                {bookingAmount == "N/A"
                  ? "N/A"
                  : currency + " " + bookingAmount}
              </div>
              {bookingAmount != "N/A" && (
                <div className="text-sm text-muted-foreground">
                  {row.original?.total_participants} × {currency}{" "}
                  {bookingAmount == "N/A"
                    ? 0
                    : bookingAmount / row.original?.total_participants}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "due_payment",
        header: "Pending Payment",
        cell: ({ row }) => {
          const activity = row.original.time_slots?.activities;
          const price =
            activity?.price || row.original?.experiences?.price || 0;
          const currency =
            activity?.currency || row.original.experiences?.currency || "INR";
          const totalAmount = price * row.original.total_participants;
          const dueAmount = row.original.due_amount || 0;
          const paidAmount = totalAmount - dueAmount;

          return (
            <div>
              <div className="text-sm text-muted-foreground">
                {currency} {dueAmount}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="space-x-2">
            <Badge className={getStatusColor(row.original.status)}>
              {row.original.status}
            </Badge>
            {/* {row.original.due_amount && row.original.due_amount > 0 && (
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-800"
              >
                Partial Payment
              </Badge>
            )} */}
          </div>
        ),
      },
      {
        accessorKey: "note_for_guide",
        header: "Notes for Guide",
        cell: ({ row }) => row.original.note_for_guide || "N/A",
      },
    ],
    [navigate, profileMap]
  );

  const table = useReactTable({
    data: filteredBookings,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) return <p className="text-center py-10">Loading...</p>;
  if (!bookings.length)
    return (
      <div className="text-center py-10 text-muted-foreground">
        No bookings yet!
      </div>
    );

  return (
    <div>
      <div className="flex justify-between items-center py-4 gap-2">
        <Input
          placeholder="Search bookings..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant={showTodayOnly ? "default" : "outline"}
          onClick={() => setShowTodayOnly((prev) => !prev)}
        >
          {showTodayOnly ? "Show All" : "Today's bookings"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table className="border">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="border px-4 py-2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="border px-4 py-2 text-start"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  {showTodayOnly ? "No bookings for today." : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
