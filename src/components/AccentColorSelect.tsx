"use client";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { ACCENT_PRESETS, type Accent } from "../theme";
import { useAccentColor } from "../app/providers";

export default function AccentColorSelect() {
  const { accent, setAccent } = useAccentColor();
  return (
    <FormControl size="small">
      <InputLabel id="accent-select-label">Accent color</InputLabel>
      <Select
        labelId="accent-select-label"
        label="Accent color"
        value={accent}
        onChange={(e) => setAccent(e.target.value as Accent)}
      >
        {ACCENT_PRESETS.map((p) => (
          <MenuItem key={p.value} value={p.value}>
            {p.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
