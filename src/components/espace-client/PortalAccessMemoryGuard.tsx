"use client";

type PortalAccessMemoryGuardProps = {
  enabled: boolean;
  email?: string;
  token?: string;
};

// Legacy shim kept for compatibility with the existing portal tree.
export function PortalAccessMemoryGuard(_props: PortalAccessMemoryGuardProps) {
  return null;
}

