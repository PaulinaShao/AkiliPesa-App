
"use client";

export const REDIRECT_KEY = "postLoginRedirect";

export function setPostLoginRedirect(url?: string) {
  const target = url || window.location.pathname + window.location.search;
  try {
    sessionStorage.setItem(REDIRECT_KEY, target);
  } catch (e) {
    console.error("Session storage is unavailable:", e);
  }
  return target;
}

export function getPostLoginRedirect(fallback: string = "/") {
  try {
    const v = sessionStorage.getItem(REDIRECT_KEY);
    if (v) {
      sessionStorage.removeItem(REDIRECT_KEY);
      return v;
    }
  } catch (e) {
     console.error("Session storage is unavailable:", e);
  }
  return fallback;
}
