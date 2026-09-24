"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PortalTokenBootstrapProps = {
  token?: string;
  email?: string;
};

export function PortalTokenBootstrap({ token, email }: PortalTokenBootstrapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startedRef = useRef(false);

  useEffect(() => {
    const currentToken = token?.trim() ?? "";
    if (!currentToken || startedRef.current) return;
    startedRef.current = true;

    void fetch("/api/portal-auth/bootstrap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        token: currentToken,
        email
      })
    }).finally(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("token");
      const query = params.toString();
      router.replace(query ? `/espace-client/portail?${query}` : "/espace-client/portail", {
        scroll: false
      });
    });
  }, [email, router, searchParams, token]);

  return null;
}

