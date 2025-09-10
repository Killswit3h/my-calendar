"use client";

import React, { useMemo } from "react";
import {
  Autocomplete,
  TextField,
  Chip,
  Avatar,
  Typography,
  Box,
  Button,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import type { Employee } from "../employees";

interface Props {
  employees: Employee[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  label?: string;
}

const LISTBOX_PADDING = 8; // px

function renderRow(props: ListChildComponentProps) {
  const { data, index, style } = props;
  return React.cloneElement(data[index], {
    style: {
      ...style,
      top: (style.top as number) + LISTBOX_PADDING,
    },
  });
}

const ListboxComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement>>(function ListboxComponent(
  props,
  ref
) {
  const { children, ...other } = props;
  const itemData = React.Children.toArray(children);
  const itemCount = itemData.length;
  const itemSize = 50;
  const height = Math.min(8, itemCount) * itemSize + 2 * LISTBOX_PADDING;
  return (
    <div ref={ref} {...other}>
      <FixedSizeList
        height={height}
        itemData={itemData}
        itemCount={itemCount}
        itemSize={itemSize}
        width="100%"
      >
        {renderRow}
      </FixedSizeList>
    </div>
  );
});

export default function EmployeeMultiSelect({ employees, value, onChange, placeholder = "Select employees", label }: Props) {
  const selected = useMemo(() => employees.filter((e) => value.includes(e.id)), [employees, value]);
  const filterOptions = (opts: Employee[], { inputValue }: any) => {
    const term = inputValue.toLowerCase();
    return opts.filter((e) => {
      const init = `${e.firstName[0] ?? ""}${e.lastName[0] ?? ""}`.toLowerCase();
      return (
        e.firstName.toLowerCase().includes(term) ||
        e.lastName.toLowerCase().includes(term) ||
        init.includes(term) ||
        e.team.toLowerCase().includes(term)
      );
    });
  };

  return (
    <Autocomplete
      multiple
      size="small"
      options={employees}
      value={selected}
      disableCloseOnSelect
      getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      filterOptions={filterOptions}
      onChange={(_, next) => onChange(next.map((n) => n.id))}
      ListboxComponent={employees.length > 200 ? ListboxComponent : undefined}
      slotProps={{
        paper: { sx: { bgcolor: (theme) => (theme.palette as any).surfaceContainerLow } },
      }}
      renderTags={(val, getTagProps) =>
        val.map((option, idx) => (
          <Chip
            {...getTagProps({ index: idx })}
            key={option.id}
            label={`${option.firstName} ${option.lastName}`}
            size="small"
          />
        ))
      }
      renderOption={(props, option) => (
        <li {...props} key={option.id} style={{ padding: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1 }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "background.paper", color: "text.secondary" }}>
              {option.firstName[0]}
              {option.lastName[0]}
            </Avatar>
            <Typography
              variant="body2"
              sx={{ flexGrow: 1, typography: "bodyMedium", color: (theme) => alpha(theme.palette.primary.main, 0.9) }}
            >
              {option.firstName} {option.lastName}
            </Typography>
            <Typography variant="body2" sx={{ typography: "bodyMedium" }} color="text.secondary">
              ({option.team})
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label ?? "Select employees"}
          placeholder={placeholder}
          size="small"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {value.length > 0 && (
                  <Button
                    color="primary"
                    size="small"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onChange([])}
                  >
                    Clear all
                  </Button>
                )}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
