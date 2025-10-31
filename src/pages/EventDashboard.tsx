// src/pages/EventDashboard.tsx
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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { supabase } from "../utils/supabaseClient"; // ✅ now used
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
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
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./css/EventDashboard.css";

// Fix default leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Colored markers by college
const collegeIcons: Record<string, L.Icon> = {
  IBM: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  ICS: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  ITE: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  Other: new L.Icon({
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
};

interface AlumniData {
  stats: {
    inactiveAlumni: number;
    totalAlumni: number;
  };
  activity: Array<{
    month: string;
    newAlumni: number;
    activeAlumni: number;
    inactiveAlumni: number;
  }>;
  locations: Array<{
    id: number;
    name: string;
    position: [number, number];
    college: "IBM" | "ICS" | "ITE" | "Other";
    status: "active" | "inactive" | "new";
  }>;
}

interface StatCardProps {
  title: string;
  value: string | number | JSX.Element; // allow spinner
  color: "primary" | "secondary" | "error" | "warning" | "info" | "success";
}

// Reset View button for map
function ResetViewControl({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const handleClick = () => {
    map.setView(center, zoom);
    map.closePopup();
  };
  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ backgroundColor: "white", "&:hover": { backgroundColor: "#f5f5f5" }, padding: "4px", margin: "2px" }}
          title="Reset view"
        >
          <GpsFixedIcon fontSize="small" />
        </IconButton>
      </div>
    </div>
  );
}

// Locate Button
function LocateControl() {
  const map = useMap();
  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const marker = L.marker([latitude, longitude]).addTo(map);
        marker.bindPopup("📍 You are here!").openPopup();
        map.setView([latitude, longitude], 13);
      },
      () => alert("Unable to retrieve your location.")
    );
  };
  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: 40 }}>
      <div className="leaflet-control leaflet-bar">
        <IconButton
          onClick={handleLocate}
          size="small"
          sx={{ backgroundColor: "white", "&:hover": { backgroundColor: "#f5f5f5" }, padding: "4px", margin: "2px" }}
          title="Find my location"
        >
          <GpsFixedIcon fontSize="small" />
        </IconButton>
      </div>
    </div>
  );
}

// Stat Cards
const StatCard = ({ title, value, color }: StatCardProps) => {
  const theme = useTheme();
  return (
    <Card sx={{ minHeight: 120, backgroundColor: theme.palette[color].main, color: theme.palette[color].contrastText, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Main Dashboard
const Dashboard = () => {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collegeFilter, setCollegeFilter] = useState("all");

  const [eventsCount, setEventsCount] = useState<number | null>(null);
  const [registrationsCount, setRegistrationsCount] = useState<number | null>(null);
  const [alumniData, setAlumniData] = useState<AlumniData | null>(null);

  const mapCenter: [number, number] = [12.988438, 121.785126];
  const initialZoom = 5;

  // Fetch counts from Supabase
  useEffect(() => {
    async function fetchCounts() {
      const { count: eventsCount } = await supabase.from("events").select("*", { count: "exact" });
      const { count: registrationsCount } = await supabase.from("event_registrations").select("*", { count: "exact" });
      setEventsCount(eventsCount || 0);
      setRegistrationsCount(registrationsCount || 0);
    }
    fetchCounts();
  }, []);

  // Mock alumni data for chart/map
  useEffect(() => {
    const mockData: AlumniData = {
      stats: { inactiveAlumni: 312, totalAlumni: 1634 },
      activity: [
        { month: "Jan", newAlumni: 5, activeAlumni: 1200, inactiveAlumni: 300 },
        { month: "Feb", newAlumni: 8, activeAlumni: 1220, inactiveAlumni: 290 },
        { month: "Mar", newAlumni: 12, activeAlumni: 1250, inactiveAlumni: 280 },
        { month: "Apr", newAlumni: 10, activeAlumni: 1260, inactiveAlumni: 295 },
        { month: "May", newAlumni: 7, activeAlumni: 1280, inactiveAlumni: 312 },
      ],
      locations: [
        { id: 1, name: "John Doe", position: [8.3593168, 124.8683004], college: "IBM", status: "active" },
        { id: 2, name: "Jane Smith", position: [8.3590237, 124.8690283], college: "ICS", status: "active" },
        { id: 3, name: "Bob Johnson", position: [8.3599979, 124.8673158], college: "ITE", status: "inactive" },
        { id: 4, name: "Alice Brown", position: [8.3593168, 124.8683004], college: "IBM", status: "new" },
      ],
    };
    setAlumniData(mockData);
  }, []);

  const handleCollegeFilterChange = (event: SelectChangeEvent) => {
    setCollegeFilter(event.target.value as string);
  };

  const filteredLocations = alumniData?.locations.filter((l) => collegeFilter === "all" || l.college === collegeFilter) || [];

  const stats: StatCardProps[] = [
    { title: "Number of Events", value: eventsCount === null ? <CircularProgress size={20} color="inherit" /> : eventsCount, color: "primary" },
    { title: "Number of Users", value: registrationsCount === null ? <CircularProgress size={20} color="inherit" /> : registrationsCount, color: "success" },
    { title: "Inactive Planters", value: alumniData?.stats.inactiveAlumni || 0, color: "warning" },
    { title: "Total Planters", value: alumniData?.stats.totalAlumni || 0, color: "info" },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      {/* Drawer */}
      <Drawer
        anchor="right"
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: 240, boxSizing: "border-box", backgroundColor: theme.palette.background.paper } }}
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
            <ListItemButton component="a" href="/settings">
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      {/* Main content */}
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
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))" gap={2} mb={3}>
            {stats.map((s) => (
              <StatCard key={s.title} {...s} />
            ))}
          </Box>

          {/* Charts + Map */}
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "40% 60%" }} gap={2}>
            {/* Chart */}
            <Card sx={{ p: 2, boxShadow: 3 }}>
              <Typography variant="subtitle1" mb={1}>
                Monthly Activity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={alumniData?.activity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="newAlumni" stroke="#8884d8" />
                  <Line type="monotone" dataKey="activeAlumni" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="inactiveAlumni" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Map */}
            <Card sx={{ height: 300, boxShadow: 3 }}>
              <MapContainer center={mapCenter} zoom={initialZoom} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredLocations.map((loc) => (
                  <Marker key={loc.id} position={loc.position} icon={collegeIcons[loc.college] || collegeIcons["Other"]}>
                    <Popup>
                      {loc.name} - {loc.college} ({loc.status})
                    </Popup>
                  </Marker>
                ))}
                <ResetViewControl center={mapCenter} zoom={initialZoom} />
                <LocateControl />
              </MapContainer>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
