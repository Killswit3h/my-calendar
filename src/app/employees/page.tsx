"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getEmployees,
  addEmployee,
  deleteEmployee,
  resetEmployees,
  type Employee,
  type Team,
} from "../../employees";
import { alpha } from "@mui/material/styles";
import * as ReactWindow from "react-window";
import AccentColorSelect from "../../components/AccentColorSelect";

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Button,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  ListItemText,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PersonOffIcon from "@mui/icons-material/PersonOff";

const FixedSizeList = ReactWindow.FixedSizeList;
type ListChildComponentProps = ReactWindow.ListChildComponentProps;

function initials(e: Employee) {
  return `${e.firstName[0] ?? ""}${e.lastName[0] ?? ""}`.toUpperCase();
}

function EmployeesPageContent() {
  const params = useSearchParams();
  const back = params.get("from") || "/";

  const [employees, setEmployees] = useState<Employee[]>(getEmployees());
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState<Team | "All">(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("team-filter");
      if (saved === "South" || saved === "Central" || saved === "All") {
        return saved;
      }
    }
    return "All";
  });

  const refresh = () => setEmployees(getEmployees());

  // Search debounce
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(id);
  }, [query]);

  const filtered = useMemo(() => {
    const term = debounced.toLowerCase();
    return employees.filter((e) => {
      if (teamFilter !== "All" && e.team !== teamFilter) return false;
      if (!term) return true;
      const init = initials(e).toLowerCase();
      return (
        e.firstName.toLowerCase().includes(term) ||
        e.lastName.toLowerCase().includes(term) ||
        init.includes(term) ||
        e.team.toLowerCase().includes(term)
      );
    });
  }, [employees, debounced, teamFilter]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("team-filter", teamFilter);
    }
  }, [teamFilter]);

  function handleReset() {
    resetEmployees();
    refresh();
  }

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [addTeam, setAddTeam] = useState<Team>("South");
  function openAdd() {
    setAddTeam(teamFilter === "All" ? "South" : teamFilter);
    setAddOpen(true);
  }
  function submitAdd() {
    const f = first.trim();
    const l = last.trim();
    if (!f) return;
    addEmployee({ firstName: f, lastName: l, team: addTeam });
    setFirst("");
    setLast("");
    setAddOpen(false);
    refresh();
  }

  // Delete dialog
  const [toDelete, setToDelete] = useState<Employee | null>(null);

  // Snackbar for undo
  const [snack, setSnack] = useState<{ open: boolean; emp?: Employee }>(
    { open: false }
  );
  function handleUndo() {
    if (snack.emp) {
      addEmployee({
        firstName: snack.emp.firstName,
        lastName: snack.emp.lastName,
        team: snack.emp.team,
      });
      refresh();
    }
    setSnack({ open: false });
  }

  return (
    <Box sx={{ maxWidth: 1080, mx: "auto" }}>
      <AppBar
        position="static"
        elevation={0}
        color="default"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Toolbar>
          <IconButton edge="start" component={Link} href={back} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h5"
            component="h1"
            sx={{ flexGrow: 1, textAlign: "center", typography: "titleLarge" }}
          >
            Employees
          </Typography>
          <IconButton edge="end" aria-label="reset" onClick={handleReset}>
            <RestartAltIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          p: 2,
          display: "grid",
          gap: 1,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" },
        }}
      >
        <TextField
          size="small"
          placeholder="Search employees"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          label="Team"
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value as Team | "All")}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="South">South</MenuItem>
          <MenuItem value="Central">Central</MenuItem>
        </TextField>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={openAdd}
        >
          Add employee
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <PersonOffIcon sx={{ fontSize: 48, mb: 1, color: "text.secondary" }} />
          <Typography variant="h6" sx={{ typography: "headlineSmall" }} gutterBottom>
            No employees yet
          </Typography>
          <Typography variant="body2" sx={{ typography: "bodyMedium" }} gutterBottom>
            Add an employee to get started.
          </Typography>
          <Button variant="contained" onClick={openAdd}>
            Add employee
          </Button>
        </Box>
      ) : filtered.length > 200 ? (
        <Box sx={{ bgcolor: (theme) => (theme.palette as any).surfaceContainerLow }}>
          <FixedSizeList
            height={Math.min(400, filtered.length * 56)}
            itemCount={filtered.length}
            itemSize={56}
            width="100%"
          >
            {({ index, style }: ListChildComponentProps) => {
              const e = filtered[index];
              return (
                <div style={style} key={e.id}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ typography: "bodyMedium" }} color="text.secondary">
                          ({e.team})
                        </Typography>
                        <Tooltip title="Delete">
                          <IconButton
                            edge="end"
                            aria-label={`Delete ${e.firstName} ${e.lastName}`}
                            sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                            onClick={() => setToDelete(e)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemButton
                      sx={{ py: 1, "&.Mui-focusVisible": { outline: (theme) => `2px solid ${theme.palette.primary.main}` } }}
                      aria-label={`Open employee ${e.firstName} ${e.lastName} (${e.team})`}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "background.paper", color: "text.secondary" }}>
                          {initials(e)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${e.firstName} ${e.lastName}`}
                        primaryTypographyProps={{
                          variant: "body2",
                          sx: {
                            typography: "bodyMedium",
                            color: (theme) => theme.palette.common.white,
                            fontWeight: 600,
                            textShadow: "0 1px 1px rgba(0,0,0,0.3)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider component="li" />
                </div>
              );
            }}
          </FixedSizeList>
        </Box>
      ) : (
        <List sx={{ bgcolor: (theme) => (theme.palette as any).surfaceContainerLow }}>
          {filtered.map((e) => (
            <React.Fragment key={e.id}>
              <ListItem
                disablePadding
                secondaryAction={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ typography: "bodyMedium" }} color="text.secondary">
                      ({e.team})
                    </Typography>
                    <Tooltip title="Delete">
                      <IconButton
                        edge="end"
                        aria-label={`Delete ${e.firstName} ${e.lastName}`}
                        sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                        onClick={() => setToDelete(e)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemButton
                  sx={{ py: 1, "&.Mui-focusVisible": { outline: (theme) => `2px solid ${theme.palette.primary.main}` } }}
                  aria-label={`Open employee ${e.firstName} ${e.lastName} (${e.team})`}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "background.paper", color: "text.secondary" }}>
                      {initials(e)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${e.firstName} ${e.lastName}`}
                    primaryTypographyProps={{
                      variant: "body2",
                      sx: {
                        typography: "bodyMedium",
                        color: (theme) => theme.palette.common.white,
                        fontWeight: 600,
                        textShadow: "0 1px 1px rgba(0,0,0,0.3)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}

      <Box sx={{ p: 2 }}>
        <AccentColorSelect />
      </Box>

      {/* Add employee dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth>
        <DialogTitle>Add employee</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="First name"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            size="small"
            autoFocus
          />
          <TextField
            label="Last name"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            size="small"
          />
          <Select
            size="small"
            value={addTeam}
            onChange={(e) => setAddTeam(e.target.value as Team)}
          >
            <MenuItem value="South">South</MenuItem>
            <MenuItem value="Central">Central</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={submitAdd} variant="contained" size="small">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>
          {`Delete ${toDelete?.firstName ?? ""} ${toDelete?.lastName ?? ""}?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (toDelete) {
                deleteEmployee(toDelete.id);
                setSnack({ open: true, emp: toDelete });
                setToDelete(null);
                refresh();
              }
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack({ open: false })}
        message={
          snack.emp
            ? `Deleted ${snack.emp.firstName} ${snack.emp.lastName}`
            : undefined
        }
        action={
          <Button color="secondary" size="small" onClick={handleUndo}>
            Undo
          </Button>
        }
      />
    </Box>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={null}>
      <EmployeesPageContent />
    </Suspense>
  );
}

