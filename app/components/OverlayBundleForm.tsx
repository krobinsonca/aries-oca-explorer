'use client';

import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select
} from "@mui/material";
import { useRouter } from "next/navigation";
import { BUNDLE_LIST_URL } from "@/app/lib/data";

export default function OverlayBundleForm({ options }: { options: any }) {
  const [option, setOption] = useState<any | undefined>(undefined);

  const { push } = useRouter();
  const handleSelect = (value: string) => {
    const option = JSON.parse(value);
    setOption(option);
    push(`/schema/${option.id}`);
  };

  return (
    <Paper style={{ padding: "1em", marginBottom: "1em" }} elevation={1}>
      <FormControl fullWidth margin="dense" id="overlay-bundle">
        <InputLabel id="overlay-bundle-label">Overlay Bundle</InputLabel>
        <Select
          labelId="overlay-bundle-label"
          label="Overlay Bundle"
          value={option ? JSON.stringify(option) : ""}
          onChange={(e) => handleSelect(e.target.value as string)}
          placeholder="Select an Overlay Bundle"
        >
          {(options ?? []).map(({ id, name, ocabundle }: {
            id: string
            name: string,
            ocabundle: string,
          }, idx: number) => (
            <MenuItem
              key={`${name}_${idx}`}
              value={JSON.stringify({
                id,
                name,
                url: BUNDLE_LIST_URL + "/" + ocabundle
              })}
            >
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  );
};
