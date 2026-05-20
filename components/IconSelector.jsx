"use client";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import PortfolioIcon from "./PortfolioIcon";
import { iconGroups, normalizeIconLabel } from "./iconRegistry";

export default function IconSelector({ label, value = [], onChange }) {
  const normalizedValue = value.map(normalizeIconLabel).filter(Boolean);

  function toggleIcon(nextLabel) {
    const normalized = normalizeIconLabel(nextLabel);
    const exists = normalizedValue.includes(normalized);
    const nextValue = exists
      ? normalizedValue.filter((item) => item !== normalized)
      : [...normalizedValue, normalized];

    onChange(nextValue);
  }

  return (
    <Stack spacing={1.2}>
      <Typography sx={{ color: "#F2C14E", fontSize: 12.5, fontWeight: 720, lineHeight: 1.1 }}>
        {label}
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 1.35,
          borderRadius: 1.4,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(242,193,78,0.13)",
        }}
      >
        <Stack spacing={1.4}>
          {iconGroups.map((group) => (
            <Stack key={group.title} spacing={0.8}>
              <Typography sx={{ color: "#8F9AAB", fontSize: 12.2, fontWeight: 720, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {group.title}
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {group.items.map((item) => {
                  const isSelected = normalizedValue.includes(item.label);

                  return (
                    <Button
                      key={item.label}
                      type="button"
                      variant="outlined"
                      onClick={() => toggleIcon(item.label)}
                      sx={{
                        minHeight: 38,
                        borderRadius: 1.15,
                        px: 1,
                        py: 0.65,
                        color: isSelected ? "#080A0F" : "#F3D483",
                        borderColor: isSelected ? "#F2C14E" : "rgba(242,193,78,0.24)",
                        background: isSelected ? "#F2C14E" : "rgba(242,193,78,0.035)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.75,
                        textTransform: "none",
                        fontSize: 12.5,
                        lineHeight: 1.15,
                        "&:hover": {
                          color: isSelected ? "#080A0F" : "#FFD35A",
                          background: isSelected ? "#FFD35A" : "rgba(242,193,78,0.08)",
                          borderColor: "rgba(255,211,90,0.70)",
                        },
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          width: 24,
                          height: 24,
                          minWidth: 24,
                          borderRadius: 0.8,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isSelected ? "#080A0F" : "#F2C14E",
                          color: isSelected ? "#F2C14E" : "#080A0F",
                        }}
                      >
                        <PortfolioIcon label={item.label} size={17} />
                      </Box>
                      {item.label}
                    </Button>
                  );
                })}
              </Box>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
