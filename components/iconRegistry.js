export const iconGroups = [
  {
    title: "Softwares",
    items: [
      { label: "Premiere", icon: "premiere" },
      { label: "After Effects", icon: "after-effects" },
      { label: "Photoshop", icon: "photoshop" },
      { label: "Illustrator", icon: "illustrator" },
      { label: "Creative Cloud", icon: "creative-cloud" },
      { label: "Creative X", icon: "creative-x" },
    ],
  },
  {
    title: "Funções",
    items: [
      { label: "Captação", icon: "camera" },
      { label: "Edição", icon: "edit" },
      { label: "Finalização", icon: "check" },
      { label: "Entrevista", icon: "mic" },
      { label: "Drone", icon: "drone" },
      { label: "Motion", icon: "motion" },
      { label: "Direção de fotografia", icon: "aperture" },
      { label: "Roteiro", icon: "script" },
      { label: "Narrativa", icon: "story" },
      { label: "Identidade", icon: "brand" },
      { label: "Colorização", icon: "color" },
      { label: "Áudio", icon: "audio" },
    ],
  },
  {
    title: "Categorias",
    items: [
      { label: "Institucional", icon: "building" },
      { label: "Evento", icon: "calendar" },
      { label: "Social", icon: "phone" },
      { label: "Documental", icon: "documentary" },
      { label: "Educacional", icon: "education" },
      { label: "Vídeo", icon: "play" },
    ],
  },
  {
    title: "Formato",
    items: [
      { label: "Horizontal 16:9", icon: "horizontal" },
      { label: "Vertical 9:16", icon: "vertical" },
      { label: "Quadrado 1:1", icon: "square" },
    ],
  },
];

export const iconOptions = iconGroups.flatMap((group) => group.items);

const aliasMap = {
  "Adobe Premiere": "Premiere",
  "Adobe Premiere Pro": "Premiere",
  "Premiere Pro": "Premiere",
  "AE": "After Effects",
  "After": "After Effects",
  "PS": "Photoshop",
  "AI": "Illustrator",
  "Captação de imagem": "Captação",
  "Direção": "Direção de fotografia",
  "DF": "Direção de fotografia",
  "Social media": "Social",
  "Horizontal": "Horizontal 16:9",
  "Vertical": "Vertical 9:16",
  "Quadrado": "Quadrado 1:1",
};

export function normalizeIconLabel(label) {
  const clean = String(label || "").trim();
  if (!clean) return "";
  return aliasMap[clean] || clean;
}

export function getIconOption(label) {
  const normalized = normalizeIconLabel(label);
  return iconOptions.find((item) => item.label === normalized) || { label: normalized, icon: "spark" };
}
