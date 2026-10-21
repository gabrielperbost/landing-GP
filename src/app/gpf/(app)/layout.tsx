import { redirect } from "next/navigation";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { GpfShell } from "@/components/gpf/GpfShell";

export default async function GpfAppLayout({ children }: { children: React.ReactNode }) {
  const authed = await hasValidGpfSession();
  if (!authed) redirect("/gpf/login");
  return <GpfShell>{children}</GpfShell>;
}
