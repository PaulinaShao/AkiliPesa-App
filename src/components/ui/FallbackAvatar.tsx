"use client";
import Image from "next/image";
import { useState } from "react";

/**
 * ✅ Tanzanite fallback avatar
 * - Uses <Image> optimization for all remote sources
 * - Shows graceful fallback if image fails
 * - Rounded & glow-styled for AkiliPesa brand
 */
export default function FallbackAvatar({
  src,
  alt = "User Avatar",
  size = 64,
  className = "",
}: {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  const fallbackSrc = "/assets/default-avatar-tanzanite.svg";

  return (
    <div
      className={`rounded-full overflow-hidden border border-[#8B5CF6]/40 shadow-md ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={!imgError && src ? src : fallbackSrc}
        alt={alt}
        width={size}
        height={size}
        className="object-cover w-full h-full"
        onError={() => setImgError(true)}
        priority
      />
    </div>
  );
}
