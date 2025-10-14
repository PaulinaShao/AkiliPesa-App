
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { setPostLoginRedirect } from "@/lib/redirect";

export default function RequireAuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Wait until the auth state is known

    if (!user) {
      // If no user, store the intended destination and redirect to login
      const target = setPostLoginRedirect(window.location.pathname + window.location.search);
      router.replace(`/auth/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [isUserLoading, user, router]);

  // While checking auth or if there's no user, render nothing to avoid flashes of content.
  if (isUserLoading || !user) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background dark">
            <p>Authenticating...</p>
        </div>
    );
  }

  // If user is authenticated, render the children components.
  return <>{children}</>;
}
