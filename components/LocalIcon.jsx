import { Box } from "@mui/material";

const defaultSx = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 18,
  height: 18,
  minWidth: 18,
  fontSize: 15,
  lineHeight: 1,
  fontWeight: 800,
};

export default function LocalIcon({ glyph = "•", sx }) {
  return (
    <Box component="span" aria-hidden="true" sx={{ ...defaultSx, ...sx }}>
      {glyph}
    </Box>
  );
}
