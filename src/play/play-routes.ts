/** Kid play routes run fully on the device (local content) and do not need the backend runtime. */
export function isPlayRoute(path: string): boolean {
  return path === "home" || path.startsWith("area/") || path.startsWith("game/") || path === "area" || path === "game";
}
