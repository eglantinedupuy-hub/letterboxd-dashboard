// Shared colours and styles for every chart, so they all look like one system.
// Text never uses the data colours — only the text tokens below.

export const chart = {
  accent: "#ff8000", // Letterboxd orange — the main series
  star: "#00e054", // ratings
  context: "#445566", // background/comparison series
  grid: "rgba(255,255,255,0.06)",
  axisText: "#99aabb",
  tooltipBg: "#2c3440",
  surface: "#1c2228",
};

export const axisTick = { fill: chart.axisText, fontSize: 12 };

export const tooltipStyle = {
  contentStyle: { background: chart.tooltipBg, border: "none", borderRadius: 12, color: "#fff" },
  labelStyle: { color: chart.axisText },
  itemStyle: { color: "#fff" },
};
