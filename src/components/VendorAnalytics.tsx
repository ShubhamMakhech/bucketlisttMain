import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  BarChart3,
  Calendar,
  Eye,
  IndianRupee,
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from "recharts";

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--info))",
  },
  bookings: {
    label: "Bookings",
    color: "hsl(var(--success))",
  },
};

// Convert USD to INR (using approximate rate of 83)
const convertToINR = (usdAmount: number) => {
  return usdAmount;
};

const COLORS = [
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--brand-secondary))",
  "hsl(var(--brand-primary))",
  "hsl(var(--gradient-secondary-end))",
  "hsl(var(--success-light))",
  "hsl(var(--warning))",
  "hsl(var(--brand-primary-dark))",
];

export const VendorAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch vendor experiences
  const { data: experiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["vendor-experiences", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("vendor_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user role creation date
  const { data: userRole } = useQuery({
    queryKey: ["user-role-date", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("role", "vendor")
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch booking analytics
  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["vendor-analytics", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const thirtyDaysAgo = subDays(new Date(), 30);

      // Fetch all time bookings for total income
      const { data: allBookings, error: allBookingsError } = await supabase
        .from("bookings")
        .select(
          `
          *,
          experiences!inner (
            vendor_id,
            title,
            price,
            currency
          )
        `
        )
        .eq("experiences.vendor_id", user.id)
        .eq("status", "confirmed");

      if (allBookingsError) throw allBookingsError;

      // Fetch recent bookings (30 days) - using booking_date instead of created_at
      const { data: recentBookings, error: recentBookingsError } =
        await supabase
          .from("bookings")
          .select(
            `
          *,
          experiences!inner (
            vendor_id,
            title,
            price,
            currency
          )
        `
          )
          .eq("experiences.vendor_id", user.id)
          .eq("status", "confirmed")
          .gte("booking_date", thirtyDaysAgo.toISOString());

      if (recentBookingsError) throw recentBookingsError;

      // Calculate total income (all time)
      const totalIncomeAllTime =
        allBookings?.reduce((sum, booking) => {
          return (
            sum + Number(booking.experiences.price) * booking.total_participants
          );
        }, 0) || 0;

      // Calculate 30-day metrics
      const totalIncome30d =
        recentBookings?.reduce((sum, booking) => {
          return (
            sum + Number(booking.experiences.price) * booking.total_participants
          );
        }, 0) || 0;

      const totalBookings = recentBookings?.length || 0;

      // Daily income data - using booking_date instead of created_at
      const dailyData = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        const dayBookings =
          recentBookings?.filter(
            (booking) =>
              format(new Date(booking.booking_date), "yyyy-MM-dd") ===
              format(date, "yyyy-MM-dd")
          ) || [];

        const dayIncome = dayBookings.reduce((sum, booking) => {
          return (
            sum + Number(booking.experiences.price) * booking.total_participants
          );
        }, 0);

        return {
          date: format(date, "MMM dd"),
          income: convertToINR(dayIncome),
          bookings: dayBookings.length,
        };
      });

      // Experience-wise data for pie chart
      const experienceData =
        experiences
          ?.map((exp, index) => {
            const expBookings =
              recentBookings?.filter((b) => b.experience_id === exp.id) || [];
            const expIncome = expBookings.reduce((sum, booking) => {
              return sum + Number(exp.price) * booking.total_participants;
            }, 0);

            return {
              name:
                exp.title.length > 20
                  ? exp.title.substring(0, 20) + "..."
                  : exp.title,
              value: convertToINR(expIncome),
              bookings: expBookings.length,
              color: COLORS[index % COLORS.length],
            };
          })
          .filter((item) => item.value > 0) || []; // Only show experiences with income

      return {
        totalIncome30d: convertToINR(totalIncome30d),
        totalIncomeAllTime: convertToINR(totalIncomeAllTime),
        totalBookings,
        dailyData,
        experienceData,
        averageDailyIncome: convertToINR(totalIncome30d / 30),
        averageMonthlyIncome: convertToINR(totalIncome30d),
        averageBookingValue:
          totalBookings > 0 ? convertToINR(totalIncome30d / totalBookings) : 0,
      };
    },
    enabled: !!user,
    staleTime: 0, // Always refetch to get latest data
    cacheTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });

  const handleEditExperience = (experienceId: string) => {
    // Navigate to edit experience page - you can adjust this route as needed
    navigate(`/edit-experience/${experienceId}`);
  };

  if (experiencesLoading || analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-3"></div>
                    <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-400 rounded"></div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const joiningDate = userRole?.created_at
    ? format(new Date(userRole.created_at), "dd MMM yyyy")
    : "N/A";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
<div className="relative overflow-hidden bg-gradient-to-br from-[#fe6bc7] to-[#e865b3] rounded-2xl p-4 md:p-6 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <h2 className="text-lg md:text-xl font-bold">
              Analytics Dashboard
            </h2>
          </div>
          <p className="text-white/90 text-xs md:text-sm leading-relaxed">
            You joined us on{" "}
            <span className="font-semibold">{joiningDate}</span> and earned{" "}
            <span className="font-bold text-yellow-200">
              ₹{analytics?.totalIncomeAllTime?.toFixed(2) || "0.00"}
            </span>{" "}
            in total revenue.
          </p>
        </div>
        <div className="absolute -top-4 -right-4 w-16 h-16 md:w-24 md:h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-6 -left-6 w-20 h-20 md:w-32 md:h-32 bg-white/5 rounded-full"></div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-green-700 dark:text-green-300 mb-1 md:mb-2">
                  30-Day Revenue
                </p>
                <p className="text-lg md:text-2xl font-bold text-green-800 dark:text-green-200 truncate">
                  ₹{analytics?.totalIncome30d?.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ₹{analytics?.averageDailyIncome?.toFixed(0) || "0"}/day avg
                </p>
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <IndianRupee className="h-5 w-5 md:h-7 md:w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 md:mb-2">
                  Total Bookings
                </p>
                <p className="text-lg md:text-2xl font-bold text-blue-800 dark:text-blue-200">
                  {analytics?.totalBookings || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  ₹{analytics?.averageBookingValue?.toFixed(0) || "0"} avg value
                </p>
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="h-5 w-5 md:h-7 md:w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-purple-700 dark:text-purple-300 mb-1 md:mb-2">
                  Growth Trend
                </p>
                <p className="text-lg md:text-2xl font-bold text-purple-800 dark:text-purple-200 truncate">
                  {analytics?.totalBookings && analytics.totalBookings > 0
                    ? "+"
                    : ""}
                  {((analytics?.totalIncome30d || 0) / 30).toFixed(0)}%
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Daily performance
                </p>
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 md:h-7 md:w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-orange-700 dark:text-orange-300 mb-1 md:mb-2">
                  Experiences
                </p>
                <p className="text-lg md:text-2xl font-bold text-orange-800 dark:text-orange-200">
                  {experiences?.length || 0}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Active listings
                </p>
              </div>
              <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Eye className="h-5 w-5 md:h-7 md:w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Daily Income Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50">
          <CardHeader className="pb-3 md:pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                Revenue Trend (30 Days)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <div className="w-full h-[280px] md:h-[350px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics?.dailyData || []}
                    margin={{
                      top: 15,
                      right: window.innerWidth < 768 ? 10 : 30,
                      left: window.innerWidth < 768 ? 10 : 20,
                      bottom: window.innerWidth < 768 ? 15 : 20,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="incomeGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--info))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--info))"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.2}
                      stroke="hsl(var(--neutral-200))"
                    />
                    <XAxis
                      dataKey="date"
                      fontSize={window.innerWidth < 768 ? 9 : 11}
                      tick={{
                        fontSize: window.innerWidth < 768 ? 9 : 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      interval={
                        window.innerWidth < 768 ? 4 : "preserveStartEnd"
                      }
                      axisLine={false}
                      tickLine={false}
                      angle={window.innerWidth < 768 ? -45 : 0}
                      textAnchor={window.innerWidth < 768 ? "end" : "middle"}
                      height={window.innerWidth < 768 ? 50 : 30}
                    />
                    <YAxis
                      fontSize={window.innerWidth < 768 ? 9 : 11}
                      tick={{
                        fontSize: window.innerWidth < 768 ? 9 : 11,
                        fill: "hsl(var(--muted-foreground))",
                      }}
                      tickFormatter={(value) =>
                        window.innerWidth < 768
                          ? `₹${
                              value > 1000
                                ? (value / 1000).toFixed(0) + "k"
                                : value
                            }`
                          : `₹${value}`
                      }
                      width={window.innerWidth < 768 ? 45 : 70}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`₹${value}`]}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                        fontSize: window.innerWidth < 768 ? "12px" : "14px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="hsl(var(--info))"
                      strokeWidth={window.innerWidth < 768 ? 2 : 3}
                      dot={{
                        fill: "hsl(var(--info))",
                        strokeWidth: 2,
                        r: window.innerWidth < 768 ? 3 : 5,
                        stroke: "#ffffff",
                      }}
                      activeDot={{
                        r: window.innerWidth < 768 ? 5 : 7,
                        stroke: "hsl(var(--info))",
                        strokeWidth: 3,
                        fill: "#ffffff",
                      }}
                      fill="url(#incomeGradient)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Experience Performance Chart */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50">
          <CardHeader className="pb-3 md:pb-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-b">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-3 w-3 md:h-4 md:w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">
                Experience Performance
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            {analytics?.experienceData &&
            analytics.experienceData.length > 0 ? (
              <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center">
                <ChartContainer
                  config={chartConfig}
                  className="h-full w-full max-w-4xl"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart
                      margin={{
                        top: window.innerWidth < 768 ? 10 : 20,
                        right: window.innerWidth < 768 ? 10 : 20,
                        bottom: window.innerWidth < 768 ? 10 : 20,
                        left: window.innerWidth < 768 ? 10 : 20,
                      }}
                    >
                      <defs>
                        {analytics.experienceData.map((entry, index) => (
                          <linearGradient
                            key={`gradient-${index}`}
                            id={`gradient-${index}`}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={entry.color}
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="100%"
                              stopColor={entry.color}
                              stopOpacity={0.6}
                            />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={analytics.experienceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) =>
                          percent > (window.innerWidth < 768 ? 10 : 5)
                            ? window.innerWidth < 768
                              ? `₹${
                                  value > 1000
                                    ? (value / 1000).toFixed(0) + "k"
                                    : value.toFixed(0)
                                }`
                              : `${name}: ₹${value.toFixed(0)}`
                            : ""
                        }
                        outerRadius={window.innerWidth < 768 ? 100 : 150}
                        innerRadius={window.innerWidth < 768 ? 40 : 60}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {analytics.experienceData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#gradient-${index})`}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value, name, props) => [
                          `₹${value}`,
                          ` ${props.payload.name} (${props.payload.bookings} bookings)`,
                        ]}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                          fontSize: window.innerWidth < 768 ? "12px" : "14px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            ) : (
              <div className="text-center py-8 md:py-16">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold mb-2 text-gray-600 dark:text-gray-300">
                  No Performance Data
                </h3>
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 px-4">
                  No income data available for your experiences in the last 30
                  days.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
