import { Box } from "@mui/material";
import { getIconOption } from "./iconRegistry";

const textIcons = {
  premiere: "Pr",
  "after-effects": "Ae",
  photoshop: "Ps",
  illustrator: "Ai",
  "creative-cloud": "Cc",
  "creative-x": "Cx",
};

function PathIcon({ icon }) {
  const strokeProps = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (icon) {
    case "camera":
      return <><path {...strokeProps} d="M4 8.5h3l1.5-2h7L17 8.5h3v9H4z" /><circle {...strokeProps} cx="12" cy="13" r="3" /></>;
    case "edit":
      return <><path {...strokeProps} d="M4 17.5l4.2-1 9.1-9.1-3.2-3.2L5 13.3z" /><path {...strokeProps} d="M12.8 5.5l3.2 3.2" /><path {...strokeProps} d="M4 20h16" /></>;
    case "check":
      return <path {...strokeProps} d="M5 12.5l4.2 4.2L19 7" />;
    case "mic":
      return <><rect {...strokeProps} x="8.5" y="3.5" width="7" height="11" rx="3.5" /><path {...strokeProps} d="M5 11.5a7 7 0 0 0 14 0" /><path {...strokeProps} d="M12 18.5V21" /></>;
    case "drone":
      return <><path {...strokeProps} d="M8 12h8" /><path {...strokeProps} d="M12 8v8" /><circle {...strokeProps} cx="5" cy="5" r="2.3" /><circle {...strokeProps} cx="19" cy="5" r="2.3" /><circle {...strokeProps} cx="5" cy="19" r="2.3" /><circle {...strokeProps} cx="19" cy="19" r="2.3" /></>;
    case "motion":
      return <><rect {...strokeProps} x="5" y="5" width="9" height="9" rx="1.5" /><path {...strokeProps} d="M10 19h7a2 2 0 0 0 2-2v-7" /><path {...strokeProps} d="M16 8l3 2-3 2" /></>;
    case "aperture":
      return <><circle {...strokeProps} cx="12" cy="12" r="8" /><path {...strokeProps} d="M12 4l3.4 7H22" /><path {...strokeProps} d="M20 16l-7.6-.2L8.8 22" /><path {...strokeProps} d="M4 8l4.2 6.6L4 20" /></>;
    case "script":
      return <><path {...strokeProps} d="M7 4h10v16H7z" /><path {...strokeProps} d="M9.5 8h5" /><path {...strokeProps} d="M9.5 11.5h5" /><path {...strokeProps} d="M9.5 15h3" /></>;
    case "story":
      return <><path {...strokeProps} d="M5 6.5h14v11H5z" /><path {...strokeProps} d="M8 10h8" /><path {...strokeProps} d="M8 13.5h5" /></>;
    case "brand":
      return <><path {...strokeProps} d="M12 3l7 4v10l-7 4-7-4V7z" /><path {...strokeProps} d="M9 12h6" /><path {...strokeProps} d="M12 9v6" /></>;
    case "color":
      return <><circle {...strokeProps} cx="12" cy="12" r="8" /><path fill="currentColor" d="M12 4a8 8 0 0 1 0 16z" /></>;
    case "audio":
      return <><path {...strokeProps} d="M5 14V10" /><path {...strokeProps} d="M9 17V7" /><path {...strokeProps} d="M13 19V5" /><path {...strokeProps} d="M17 16V8" /></>;
    case "building":
      return <><path {...strokeProps} d="M5 20V7l7-3 7 3v13" /><path {...strokeProps} d="M9 20v-6h6v6" /><path {...strokeProps} d="M9 9h.01" /><path {...strokeProps} d="M12 9h.01" /><path {...strokeProps} d="M15 9h.01" /></>;
    case "calendar":
      return <><rect {...strokeProps} x="4" y="6" width="16" height="14" rx="2" /><path {...strokeProps} d="M8 4v4" /><path {...strokeProps} d="M16 4v4" /><path {...strokeProps} d="M4 10h16" /></>;
    case "phone":
      return <><rect {...strokeProps} x="8" y="3" width="8" height="18" rx="2" /><path {...strokeProps} d="M11 17.5h2" /></>;
    case "documentary":
      return <><rect {...strokeProps} x="4" y="6" width="16" height="12" rx="2" /><path {...strokeProps} d="M8 6V4" /><path {...strokeProps} d="M16 6V4" /><path {...strokeProps} d="M9 10l5 2-5 2z" /></>;
    case "education":
      return <><path {...strokeProps} d="M4 9l8-4 8 4-8 4z" /><path {...strokeProps} d="M7 11v4.5c2.8 2 7.2 2 10 0V11" /></>;
    case "horizontal":
      return <rect {...strokeProps} x="3.5" y="7" width="17" height="10" rx="1.8" />;
    case "vertical":
      return <rect {...strokeProps} x="8" y="3" width="8" height="18" rx="1.8" />;
    case "square":
      return <rect {...strokeProps} x="5" y="5" width="14" height="14" rx="2" />;
    case "play":
      return <><circle {...strokeProps} cx="12" cy="12" r="8" /><path fill="currentColor" d="M10 8.5v7l6-3.5z" /></>;
    case "spark":
    default:
      return <><path {...strokeProps} d="M12 3l1.7 5.4L19 10l-5.3 1.6L12 17l-1.7-5.4L5 10l5.3-1.6z" /><path {...strokeProps} d="M18 16l.7 2.3L21 19l-2.3.7L18 22l-.7-2.3L15 19l2.3-.7z" /></>;
  }
}

export default function PortfolioIcon({ label, icon, size = 18, sx }) {
  const option = icon ? { icon } : getIconOption(label);
  const text = textIcons[option.icon];

  return (
    <Box
      component="span"
      aria-hidden="true"
      sx={{
        width: size,
        height: size,
        minWidth: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "currentColor",
        lineHeight: 1,
        overflow: "hidden",
        ...sx,
      }}
    >
      {text ? (
        <Box
          component="svg"
          viewBox="0 0 24 24"
          sx={{ width: "100%", height: "100%", display: "block" }}
        >
          <text
            x="12"
            y="12.35"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="currentColor"
            fontSize="9.4"
            fontWeight="900"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="-0.6"
          >
            {text}
          </text>
        </Box>
      ) : (
        <Box
          component="svg"
          viewBox="0 0 24 24"
          sx={{ width: "100%", height: "100%", display: "block" }}
        >
          <PathIcon icon={option.icon} />
        </Box>
      )}
    </Box>
  );
}
