
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useFirebaseUser } from "@/firebase";
import { setPostLoginRedirect } from "@/lib/redirect";

export const useAuthRedirect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useFirebaseUser();

  useEffect(() => {
    if (isUserLoading) {
      return; 
    }

    if (!user) {
      // If no user, store the intended destination and redirect to login
      const target = setPostLoginRedirect(pathname);
      router.replace(`/auth/login?redirect=${encodeURIComponent(target)}`);
    }

  }, [user, isUserLoading, router, pathname]);

  return isUserLoading;
};
