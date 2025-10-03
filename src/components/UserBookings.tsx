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
    },
    enabled: !!user,
  });

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
            <div className="cursor-pointer"
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
        accessorKey: "booking_participants",
        header: "Participants",
        cell: ({ row }) => row.original.booking_participants[0]?.name || "N/A",
      },
      {
        accessorKey: "booking_participants_number",
        header: "Contact Number",
        cell: ({ row }) =>
          row.original.booking_participants[0]?.phone_number || "N/A",
      },
      {
        accessorKey: "total_participants",
        header: "No. of Participants",
        cell: ({ row }) => row.original.booking_participants?.length || "N/A",
      },
      {
        accessorKey: "price",
        header: "Total Amount",
        cell: ({ row }) => {
          const activity = row.original.time_slots?.activities;
          const price = activity?.price || row.original.experiences?.price || 0;
          const currency =
            activity?.currency || row.original.experiences?.currency || "INR";
          const totalAmount = price * row.original.total_participants;
          const dueAmount = row.original.due_amount || 0;
          const paidAmount = totalAmount - dueAmount;

          return (
            <div>
              <div className="text-lg font-bold text-orange-500 mb-1">
                {currency} {totalAmount}
              </div>
              <div className="text-sm text-muted-foreground">
                {row.original.total_participants} × {currency} {price}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "due_payment",
        header: "Pending Payment",
        cell: ({ row }) => {
          const activity = row.original.time_slots?.activities;
          const price = activity?.price || row.original.experiences?.price || 0;
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
    [navigate]
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
              <TableRow key={headerGroup.id} >
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
                    <TableCell key={cell.id} className="border px-4 py-2 text-start">
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
