
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern browsers: Use Clipboard API
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Clipboard API write failed, trying fallback:", err);
      // Fallthrough to legacy method
    }
  }

  // Fallback for older browsers or blocked environments
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed"; // prevent scrolling to bottom
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    
    if (success) {
      return true;
    }
  } catch (err) {
    console.error("Fallback clipboard copy failed:", err);
  }

  return false;
}
