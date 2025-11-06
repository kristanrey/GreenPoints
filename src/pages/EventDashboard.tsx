import { JSX, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  AppBar,
  Toolbar,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Paper,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { supabase } from "../utils/supabaseClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./css/EventDashboard.css";

interface Participant {
  response_id: number;
  event_id: number;
  user_id: string;
  username: string;
  photo: string | null;
  points: number;
  created_at: string;
  status: string;
}

interface StatCardProps {
  title: string;
  value: string | number | JSX.Element;
  color: "primary" | "secondary" | "error" | "warning" | "info" | "success";
}

const StatCard = ({ title, value, color }: StatCardProps) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        minHeight: 120,
        backgroundColor: theme.palette[color].main,
        color: theme.palette[color].contrastText,
        boxShadow: 3,
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          {title}
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [eventsCount, setEventsCount] = useState<number | null>(null);
  const [registrationsCount, setRegistrationsCount] = useState<number | null>(
    null
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const [inactivePlanters, setInactivePlanters] = useState<number | null>(null);
  const [totalPlanters, setTotalPlanters] = useState<number | null>(null);
  const [approvedTrees, setApprovedTrees] = useState<number | null>(null);
  const [rejectedTrees, setRejectedTrees] = useState<number | null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState("daily");
  const [logData, setLogData] = useState<{ period: string; count: number }[]>(
    []
  );

  // Fetch counts
  useEffect(() => {
    async function fetchCounts() {
      const { count: eventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact" });

      const { count: registrationsCount } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact" });

      setEventsCount(eventsCount || 0);
      setRegistrationsCount(registrationsCount || 0);
    }
    fetchCounts();
  }, []);

  // Fetch planter data
  useEffect(() => {
    async function fetchPlanterData() {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, role, trees_planted, last_submission");

      if (error) {
        console.error("Error fetching planter data:", error);
        return;
      }
      if (!data) return;

      const total = data.filter(
        (p) => p.trees_planted && p.trees_planted > 0
      ).length;
      const now = new Date();
      const inactiveThresholdDays = 30;

      const inactive = data.filter((p) => {
        if (!p.last_submission) return true;
        const lastDate = new Date(p.last_submission);
        const diffDays =
          (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
        return diffDays > inactiveThresholdDays;
      }).length;

      setTotalPlanters(total);
      setInactivePlanters(inactive);
    }
    fetchPlanterData();
  }, []);

  // Fetch approved and rejected trees
  useEffect(() => {
    async function fetchTreeCounts() {
      const approved = await supabase
        .from("tree_submissions")
        .select("*", { count: "exact" })
        .eq("status", "approved");

      const rejected = await supabase
        .from("tree_submissions")
        .select("*", { count: "exact" })
        .eq("status", "rejected");

      if (approved.error)
        console.error("Error fetching approved trees:", approved.error);
      if (rejected.error)
        console.error("Error fetching rejected trees:", rejected.error);

      setApprovedTrees(approved.count || 0);
      setRejectedTrees(rejected.count || 0);
    }

    fetchTreeCounts();
  }, []);

  // Fetch participants
  useEffect(() => {
    async function fetchParticipants() {
      const { data, error } = await supabase
        .from("event_responses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading participants:", error);
        return;
      }

      setParticipants(data || []);
    }

    fetchParticipants();
  }, []);

  // Fetch logs
  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from("logs")
        .select("action, login_time")
        .order("login_time", { ascending: true });

      if (error) {
        console.error("Error fetching logs:", error);
        return;
      }
      if (!data) return;

      const logCounts: { [key: string]: number } = {};

      data.forEach((log) => {
        if (log.action === "login") {
          const date = new Date(log.login_time);
          let key = "";

          if (logFilter === "daily") {
            key = date.toLocaleDateString("default", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          } else {
            const onejan = new Date(date.getFullYear(), 0, 1);
            const week = Math.ceil(
              ((date.getTime() - onejan.getTime()) / 86400000 +
                onejan.getDay() +
                1) /
                7
            );
            key = `Week ${week}, ${date.getFullYear()}`;
          }

          logCounts[key] = (logCounts[key] || 0) + 1;
        }
      });

      const formatted = Object.entries(logCounts).map(([period, count]) => ({
        period,
        count,
      }));

      setLogs(data);
      setLogData(formatted);
    }

    fetchLogs();
  }, [logFilter]);

  const filteredParticipants =
    statusFilter === "all"
      ? participants
      : participants.filter((p) => p.status === statusFilter);

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as string);
  };

  const stats: StatCardProps[] = [
    {
      title: "Number of Events",
      value:
        eventsCount === null ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          eventsCount
        ),
      color: "primary",
    },
    {
      title: "Number of Participants",
      value:
        registrationsCount === null ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          registrationsCount
        ),
      color: "success",
    },
    {
      title: "Inactive Planters",
      value:
        inactivePlanters === null ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          inactivePlanters
        ),
      color: "warning",
    },
    {
      title: "Total Planters",
      value:
        totalPlanters === null ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          totalPlanters
        ),
      color: "info",
    },
    {
      title: "Approved / Rejected Trees",
      value:
        approvedTrees === null || rejectedTrees === null ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          `${approvedTrees} / ${rejectedTrees}`
        ),
      color: "secondary",
    },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Drawer */}
      <Drawer
        anchor="right"
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: 240,
            boxSizing: "border-box",
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6">🎓 Admin Portal</Typography>
        </Box>
        <Divider />
        <List>
          {[
            { text: "Dashboard", href: "/dashboard" },
            { text: "Create Event", href: "/GreenPoints/event" },
            { text: "Validate", href: "/GreenPoints/validate" },
            { text: "Events", href: "/GreenPoints/adminvalidateevent" },
            { text: "Manage", href: "/GreenPoints/adminmanage" },
            { text: "Leaderboards", href: "/GreenPoints/leaderboard" },
            { text: "Event Leaderboards", href: "/GreenPoints/EventLearderboards" },
            { text: "Feedback", href: "/GreenPoints/feedbackadmin" },
            { text: "Statistics", href: "/GreenPoints/statistics" },
            { text: "News", href: "/GreenPoints/news" },
            { text: "Settings", href: "/settings" },
          ].map((item) => (
            <ListItem disablePadding key={item.text}>
              <ListItemButton component="a" href={item.href}>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          height: "100vh",
        }}
      >
        <AppBar position="sticky" color="primary">
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Typography variant="h6">Admin Dashboard</Typography>
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 2 }}>
          {/* Stats */}
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))"
            gap={2}
            mb={3}
          >
            {stats.map((s) => (
              <StatCard key={s.title} {...s} />
            ))}
          </Box>

          {/* Chart + Participant List */}
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "40% 60%" }}
            gap={2}
          >
            {/* Login Activity Chart */}
            <Card sx={{ p: 2, boxShadow: 3, minHeight: 400 }}>
              <Typography variant="subtitle1" mb={1}>
                User Login Activity
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>View By</InputLabel>
                <Select
                  value={logFilter}
                  label="View By"
                  onChange={(e) => setLogFilter(e.target.value)}
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                </Select>
              </FormControl>

              {logData.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  No login activity found.
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={logData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#1976d2"
                      name="Logins"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Participant List */}
            <Card
              sx={{
                p: 2,
                boxShadow: 3,
                minHeight: 400,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="subtitle1" mb={1}>
                Event Response
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>

              <TableContainer
                component={Paper}
                sx={{ flexGrow: 1, overflowY: "auto", maxHeight: 300 }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Photo</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Event ID</TableCell>
                      <TableCell>Points</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredParticipants.length > 0 ? (
                      filteredParticipants.map((p) => (
                        <TableRow key={p.response_id} hover>
                          <TableCell>
                            <Avatar
                              src={p.photo || undefined}
                              alt={p.username}
                              sx={{ width: 32, height: 32 }}
                            />
                          </TableCell>
                          <TableCell>{p.username}</TableCell>
                          <TableCell>{p.event_id}</TableCell>
                          <TableCell>{p.points}</TableCell>
                          <TableCell
                            sx={{
                              color:
                                p.status === "approved"
                                  ? "green"
                                  : p.status === "pending"
                                  ? "orange"
                                  : "red",
                              fontWeight: "bold",
                              textTransform: "capitalize",
                            }}
                          >
                            {p.status}
                          </TableCell>
                          <TableCell>
                            {new Date(p.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No participants found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
