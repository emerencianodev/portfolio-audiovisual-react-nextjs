import { Box } from "@mui/material";
import PortfolioIcon from "./PortfolioIcon";
import { normalizeIconLabel } from "./iconRegistry";

function PillIcon({ label, dense = false }) {
  const size = dense ? 22 : 24;

  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        width: size,
        height: size,
        minWidth: size,
        flex: `0 0 ${size}px`,
        borderRadius: 0.8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "#080A0F",
        background: "#F2C14E",
        boxShadow: "0 6px 16px rgba(242, 193, 78, 0.14)",
        overflow: "hidden",
      }}
    >
      <PortfolioIcon label={label} size={dense ? 16.5 : 18} />
    </Box>
  );
}

export default function IconPill({ label, dense = false }) {
  const normalizedLabel = normalizeIconLabel(label);

  return (
    <Box
      component="span"
      sx={{
        minHeight: dense ? 31 : 34,
        maxWidth: "100%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 1 auto",
        gap: dense ? 0.7 : 0.8,
        px: dense ? 0.85 : 0.95,
        py: dense ? 0.45 : 0.55,
        borderRadius: 1.1,
        color: "#F3D483",
        border: "1px solid rgba(242, 193, 78, 0.24)",
        background: "rgba(242, 193, 78, 0.07)",
        fontSize: dense ? 12.4 : 13,
        lineHeight: 1.15,
        verticalAlign: "middle",
        boxSizing: "border-box",
        overflow: "visible",
      }}
    >
      <PillIcon label={normalizedLabel} dense={dense} />
      <Box
        component="span"
        sx={{
          minWidth: 0,
          maxWidth: "100%",
          display: "inline-flex",
          alignItems: "center",
          lineHeight: 1.15,
          whiteSpace: "normal",
          overflowWrap: "anywhere",
        }}
      >
        {normalizedLabel}
      </Box>
    </Box>
  );
}
