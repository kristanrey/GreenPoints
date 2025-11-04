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

interface ParticipantActivity {
  month: string;
  newParticipants: number;
  activeParticipants: number;
  inactiveParticipants: number;
}

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
  color:
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success";
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
      }}
    >
      <CardContent>
        <Typography variant="subtitle1">{title}</Typography>
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
  const [registrationsCount, setRegistrationsCount] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");

  const [inactivePlanters, setInactivePlanters] = useState<number | null>(null);
  const [totalPlanters, setTotalPlanters] = useState<number | null>(null);
  const [activityData, setActivityData] = useState<ParticipantActivity[]>([]);

  // Fetch event & registration counts
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

  // Fetch planter data from profiles
  useEffect(() => {
    async function fetchPlanterData() {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, role, last_submission");

      if (error) {
        console.error("Error fetching planter data:", error);
        return;
      }
      if (!data) return;

      const now = new Date();
      const inactiveThresholdDays = 30;

      const total = data.filter(
        (p) => p.role === "user" || p.role === "planter"
      ).length;

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

  // Fetch participants and activity
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

      // Compute monthly activity stats
      if (data) {
        const months = [
          "Jan", "Feb", "Mar", "Apr", "May",
          "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];

        const grouped: { [key: string]: ParticipantActivity } = {};

        months.forEach((m) => {
          grouped[m] = {
            month: m,
            newParticipants: 0,
            activeParticipants: 0,
            inactiveParticipants: 0,
          };
        });

        data.forEach((p) => {
          const date = new Date(p.created_at);
          const month = months[date.getMonth()];

          // New = every new record
          grouped[month].newParticipants += 1;

          // Active = approved
          if (p.status === "approved") grouped[month].activeParticipants += 1;

          // Inactive = rejected or pending
          if (p.status === "rejected" || p.status === "pending")
            grouped[month].inactiveParticipants += 1;
        });

        const chartData = Object.values(grouped);
        setActivityData(chartData);
      }
    }

    fetchParticipants();
  }, []);

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
  ];

  return (
    <Box sx={{ display: "flex" }}>
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
          <ListItem disablePadding>
            <ListItemButton component="a" href="/dashboard">
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
           <ListItem disablePadding>
            <ListItemButton component="a" href="/GreenPoints/event">
              <ListItemText primary="Create Event" />
            </ListItemButton>
          </ListItem>
            <ListItem disablePadding>
            <ListItemButton component="a" href="/GreenPoints/validate">
              <ListItemText primary="Validate" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component="a" href="/GreenPoints/adminvalidateevent">
              <ListItemText primary="Events" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component="a" href="/GreenPoints/adminmanage">
              <ListItemText primary="Manage" />
            </ListItemButton>
          </ListItem>
           <ListItem disablePadding>
            <ListItemButton component="a" href="/GreenPoints/leaderboard">
              <ListItemText primary="Leaderboards" />
            </ListItemButton>
          </ListItem>
           <ListItem disablePadding>
            <ListItemButton component="a" href="/GreenPoints/feedback">
              <ListItemText primary="Feedback" />
            </ListItemButton>
          </ListItem>
             <ListItem disablePadding>
            <ListItemButton component="a" href="/GreenPoints/statistics">
              <ListItemText primary="Statistics" />
            </ListItemButton>
          </ListItem>
           <ListItem disablePadding>
            <ListItemButton component="a" href="/GreenPoints/news">
              <ListItemText primary="News" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component="a" href="/settings">
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" color="primary">
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Typography variant="h6">Admin Event Dashboard</Typography>
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
            {/* Chart */}
            <Card sx={{ p: 2, boxShadow: 3 }}>
              <Typography variant="subtitle1" mb={1}>
                Monthly Participant Activity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="newParticipants" stroke="#8884d8" />
                  <Line type="monotone" dataKey="activeParticipants" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="inactiveParticipants" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Participant List */}
            <Card sx={{ p: 2, boxShadow: 3 }}>
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

              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
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
