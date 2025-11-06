import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  TextField,
  Collapse,
  IconButton,
  Checkbox,
  Divider,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { supabase } from "../utils/supabaseClient";

interface TreeSubmission {
  submission_id: number;
  user_id: string;
  tree_name: string;
  image_url: string;
  status: string;
  description: string;
  date_planted: string;
  greenpoints: number;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  role: string;
  trees_planted: number;
  greenpoints: number;
  avatar_url?: string;
}

interface DeletionLog {
  id: number;
  admin_id: string;
  deleted_ids: number[];
  reason: string;
  created_at: string;
}

const POINTS_PER_TREE = 30;

const DuplicateChecker: React.FC = () => {
  const [submissions, setSubmissions] = useState<TreeSubmission[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState("Duplicate");
  const [loading, setLoading] = useState(true);
  const [demeritPoints, setDemeritPoints] = useState<number>(10);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [deletionLogs, setDeletionLogs] = useState<DeletionLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  useEffect(() => {
    fetchAdmin();
    fetchData();
    fetchDeletionLogs();
  }, [filter]);

  // ✅ Fetch logged-in admin ID
  const fetchAdmin = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) setAdminId(data.user.id);
  };

  // ✅ Fetch submissions + profiles
  const fetchData = async () => {
    setLoading(true);
    const { data: submissionsData, error: submissionsError } = await supabase
      .from("tree_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (submissionsError) {
      console.error(submissionsError);
      setLoading(false);
      return;
    }

    let filtered = (submissionsData || []) as TreeSubmission[];

    if (filter === "Duplicate") {
      const approvedOnly = filtered.filter((s) => s.status === "approved");
      const duplicateApproved = approvedOnly.filter((item, index, self) => {
        return (
          index !==
          self.findIndex(
            (s) => s.user_id === item.user_id && s.tree_name === item.tree_name
          )
        );
      });
      filtered = duplicateApproved;
    } else if (filter === "No Duplicate") {
      filtered = filtered.filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (s) => s.user_id === item.user_id && s.tree_name === item.tree_name
          )
      );
    }

    setSubmissions(filtered);

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error(profilesError);
      setLoading(false);
      return;
    }

    const profilesMap: Record<string, UserProfile> = {};
    (profilesData || []).forEach((profile: any) => {
      profilesMap[profile.user_id] = {
        ...profile,
        trees_planted: Math.floor((profile.greenpoints || 0) / POINTS_PER_TREE),
      };
    });

    setProfiles(profilesMap);
    setLoading(false);
  };

  // ✅ Fetch Deletion Logs
  const fetchDeletionLogs = async () => {
    setLoadingLogs(true);
    const { data, error } = await supabase
      .from("deletion_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching deletion logs:", error);
    else setDeletionLogs(data || []);

    setLoadingLogs(false);
  };

  // ✅ Expand/collapse per user
  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // ✅ Individual selection
  const handleSelect = (submission_id: number) => {
    setSelectedSubmissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(submission_id)) newSet.delete(submission_id);
      else newSet.add(submission_id);
      return newSet;
    });
  };

  // ✅ Select all for user
  const handleSelectAllForUser = (userId: string) => {
    const userSubs = submissions.filter((s) => s.user_id === userId);
    const allSelected = userSubs.every((s) =>
      selectedSubmissions.has(s.submission_id)
    );

    const newSet = new Set(selectedSubmissions);
    if (allSelected) {
      userSubs.forEach((s) => newSet.delete(s.submission_id));
    } else {
      userSubs.forEach((s) => newSet.add(s.submission_id));
    }
    setSelectedSubmissions(newSet);
  };

  // ✅ Demerit / Ban
  const handleAction = async (user_id: string, action: "demerit" | "ban") => {
    try {
      const user = profiles[user_id];
      if (!user) return alert("User not found");

      if (action === "demerit") {
        const deduct = Math.min(demeritPoints, user.greenpoints);
        const newPoints = Math.max(0, user.greenpoints - deduct);

        const { error } = await supabase
          .from("profiles")
          .update({
            greenpoints: newPoints,
            trees_planted: Math.floor(newPoints / POINTS_PER_TREE),
          })
          .eq("user_id", user_id);

        if (error) throw error;
        alert(`✅ Deducted ${deduct} points from ${user.username}`);
      } else if (action === "ban") {
        const { error } = await supabase
          .from("profiles")
          .update({ role: "banned" })
          .eq("user_id", user_id);

        if (error) throw error;
        alert(`🚫 User ${user.username} has been banned.`);
      }

      fetchData();
    } catch (err) {
      console.error("handleAction error:", err);
      alert("Failed to update user.");
    }
  };

  // ✅ Delete selected submissions + log + update points
  const handleDeleteSelected = async () => {
    if (selectedSubmissions.size === 0) {
      alert("No submissions selected.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete the selected submissions?")) return;

    const idsToDelete = Array.from(selectedSubmissions);
    try {
      const { data: existingRows, error: verifyError } = await supabase
        .from("tree_submissions")
        .select("submission_id, user_id")
        .in("submission_id", idsToDelete);

      if (verifyError) throw verifyError;
      if (!existingRows || existingRows.length === 0) {
        alert("⚠️ No matching submissions found.");
        return;
      }

      const { data: deletedRows, error: deleteError } = await supabase
        .from("tree_submissions")
        .delete()
        .in("submission_id", idsToDelete)
        .select("submission_id");

      if (deleteError) throw deleteError;
      if (!deletedRows || deletedRows.length === 0) {
        alert("⚠️ No submissions were deleted. Check IDs and constraints.");
        return;
      }

      // Log deletion
      if (adminId) {
        await supabase.from("deletion_logs").insert([
          {
            admin_id: adminId,
            deleted_ids: idsToDelete,
            reason: "Duplicate cleanup by admin",
            created_at: new Date().toISOString(),
          },
        ]);
      }

      // Deduct points
      const affectedUsers = Array.from(new Set(existingRows.map((r) => r.user_id)));
      for (const uid of affectedUsers) {
        const user = profiles[uid];
        if (!user) continue;
        const deletedCount = existingRows.filter((r) => r.user_id === uid).length;
        const deductPoints = deletedCount * POINTS_PER_TREE;
        const newPoints = Math.max(0, user.greenpoints - deductPoints);
        const newTrees = Math.floor(newPoints / POINTS_PER_TREE);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            greenpoints: newPoints,
            trees_planted: newTrees,
          })
          .eq("user_id", uid);

        if (updateError) console.error(`⚠️ Failed to update ${uid}:`, updateError);
      }

      alert(`✅ Deleted ${deletedRows.length} submissions and logged successfully.`);
      setSelectedSubmissions(new Set());
      fetchData();
      fetchDeletionLogs();
    } catch (err: any) {
      console.error("❌ Delete error:", err);
      alert(`❌ Failed: ${err.message}`);
    }
  };

  const sortedProfiles = Object.values(profiles).sort(
    (a, b) => (b.greenpoints || 0) - (a.greenpoints || 0)
  );

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        🌱 Duplicate Submission Checker
      </Typography>

      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter</InputLabel>
          <Select value={filter} label="Filter" onChange={(e) => setFilter(e.target.value)}>
            <MenuItem value="Duplicate">Duplicate (Approved Only)</MenuItem>
            <MenuItem value="No Duplicate">No Duplicate</MenuItem>
            <MenuItem value="All">All</MenuItem>
          </Select>
        </FormControl>

        <TextField
          type="number"
          label="Demerit Points"
          value={demeritPoints}
          onChange={(e) => setDemeritPoints(Number(e.target.value))}
          sx={{ width: 160 }}
          inputProps={{ min: 1 }}
        />

        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteSelected}
          disabled={selectedSubmissions.size === 0}
        >
          Delete Selected & Deduct Points
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: "70vh", borderRadius: 2, boxShadow: 2 }}>
          <Table stickyHeader>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell />
                <TableCell>User ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Greenpoints</TableCell>
                <TableCell>Trees Planted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProfiles.map((user) => {
                const userSubs = submissions.filter((s) => s.user_id === user.user_id);
                const hasDuplicates = userSubs.length > 0;

                return (
                  <React.Fragment key={user.user_id}>
                    <TableRow hover>
                      <TableCell>
                        {hasDuplicates && (
                          <IconButton onClick={() => toggleExpand(user.user_id)}>
                            {expandedUsers[user.user_id] ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>{user.user_id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.greenpoints}</TableCell>
                      <TableCell>{user.trees_planted}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          color="warning"
                          sx={{ mr: 1 }}
                          onClick={() => handleAction(user.user_id, "demerit")}
                        >
                          Demerit
                        </Button>
                        <Button
                          size="small"
                          color="secondary"
                          onClick={() => handleAction(user.user_id, "ban")}
                        >
                          Ban
                        </Button>
                      </TableCell>
                    </TableRow>

                    {hasDuplicates && (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ p: 0, borderBottom: "none" }}>
                          <Collapse in={expandedUsers[user.user_id]} timeout="auto" unmountOnExit>
                            <Box p={1}>
                              <Box display="flex" alignItems="center" mb={1}>
                                <Checkbox
                                  checked={userSubs.every((s) =>
                                    selectedSubmissions.has(s.submission_id)
                                  )}
                                  onChange={() => handleSelectAllForUser(user.user_id)}
                                />
                                <Typography variant="subtitle2">
                                  Select All Duplicates for this User
                                </Typography>
                              </Box>

                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                                    <TableCell>Select</TableCell>
                                    <TableCell>Submission ID</TableCell>
                                    <TableCell>Tree Name</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Image</TableCell>
                                    <TableCell>Created At</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {userSubs.map((sub) => (
                                    <TableRow key={sub.submission_id} hover>
                                      <TableCell>
                                        <Checkbox
                                          checked={selectedSubmissions.has(sub.submission_id)}
                                          onChange={() => handleSelect(sub.submission_id)}
                                        />
                                      </TableCell>
                                      <TableCell>{sub.submission_id}</TableCell>
                                      <TableCell>{sub.tree_name}</TableCell>
                                      <TableCell>{sub.status}</TableCell>
                                      <TableCell>{sub.description}</TableCell>
                                      <TableCell>
                                        <img
                                          src={sub.image_url}
                                          alt={sub.tree_name}
                                          width={50}
                                          style={{ borderRadius: 5 }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        {new Date(sub.created_at).toLocaleString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 🧾 View Deletion Logs Section */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="h6" gutterBottom>
        🧾 Deletion Logs
      </Typography>
      {loadingLogs ? (
        <CircularProgress />
      ) : deletionLogs.length === 0 ? (
        <Typography>No deletion logs found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "#f9f9f9" }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Admin ID</TableCell>
                <TableCell>Deleted IDs</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deletionLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>{log.admin_id}</TableCell>
                  <TableCell>{Array.isArray(log.deleted_ids) ? log.deleted_ids.join(", ") : log.deleted_ids}</TableCell>
                  <TableCell>{log.reason}</TableCell>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default DuplicateChecker;
