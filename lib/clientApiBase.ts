export function getApiBase() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}
