// @ts-nocheck
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Edit, XCircle, RotateCcw, Plus } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface BookingLog {
  id: string;
  booking_id: string;
  action: "created" | "updated" | "canceled" | "restored";
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  cancellation_note: string | null;
  created_at: string;
  changed_by_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface BookingTimelineProps {
  bookingId: string;
}

export const BookingTimeline: React.FC<BookingTimelineProps> = ({
  bookingId,
}) => {
  const { isAdmin } = useUserRole();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["booking-logs", bookingId],
    queryFn: async () => {
      const { data: logsData, error } = await supabase
        .from("booking_logs")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching booking logs:", error);
        throw error;
      }

      // Fetch profiles for changed_by users
      const changedByUserIds = [
        ...new Set(
          (logsData || [])
            .map((log) => log.changed_by)
            .filter(Boolean) as string[]
        ),
      ];

      let profilesMap: Record<string, any> = {};
      if (changedByUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", changedByUserIds);

        profilesMap = (profiles || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
      }

      // Map logs with profiles
      return (logsData || []).map((log) => ({
        ...log,
        changed_by_profile: log.changed_by
          ? profilesMap[log.changed_by] || null
          : null,
      })) as BookingLog[];
    },
    enabled: !!bookingId && isAdmin,
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            You don't have permission to view booking timelines.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-4 w-4" />;
      case "updated":
        return <Edit className="h-4 w-4" />;
      case "canceled":
        return <XCircle className="h-4 w-4" />;
      case "restored":
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "updated":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "canceled":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      case "restored":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatFieldName = (fieldName: string | null) => {
    if (!fieldName) return "N/A";
    return fieldName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatValue = (value: string | null) => {
    if (value === null || value === "") return <span className="text-gray-400 italic">(empty)</span>;
    return value;
  };

  const getChangedByDisplay = (log: BookingLog) => {
    if (log.changed_by_profile) {
      const firstName = log.changed_by_profile.first_name || "";
      const lastName = log.changed_by_profile.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || log.changed_by_profile.email || "Unknown";
    }
    return "System";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No activity logs found for this booking.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Booking Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date & Time</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
                <TableHead className="w-[150px]">Field</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
                <TableHead className="w-[150px]">Changed By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getActionBadgeColor(log.action)} flex items-center gap-1 w-fit`}
                    >
                      {getActionIcon(log.action)}
                      <span className="capitalize">{log.action}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.field_name ? formatFieldName(log.field_name) : "-"}
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">
                    {log.action === "created" ? (
                      <span className="text-gray-400 italic">N/A</span>
                    ) : (
                      formatValue(log.old_value)
                    )}
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">
                    {formatValue(log.new_value)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {getChangedByDisplay(log)}
                  </TableCell>
                  <TableCell className="text-xs max-w-[250px]">
                    {log.cancellation_note ? (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-2">
                        <p className="text-red-800 dark:text-red-300">
                          {log.cancellation_note}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
