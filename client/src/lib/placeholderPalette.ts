const GRADIENTS: [string, string][] = [
  ["#6fa8c9", "#2f5c78"],
  ["#f0c6d3", "#c98aa0"],
  ["#f2d34a", "#d9a72a"],
  ["#d7b98a", "#9c7c52"],
  ["#bcd6e0", "#5c8ca0"],
  ["#8fa998", "#4c6b5a"],
  ["#c9a24a", "#8a6a20"],
  ["#8a8a8a", "#3a3a3a"],
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function placeholderGradient(id: string): [string, string] {
  return GRADIENTS[hashString(id) % GRADIENTS.length];
}
