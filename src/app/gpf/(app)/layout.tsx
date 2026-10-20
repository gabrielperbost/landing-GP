import { redirect } from "next/navigation";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { GpfNav } from "@/components/gpf/GpfNav";

export default async function GpfAppLayout({ children }: { children: React.ReactNode }) {
  const authed = await hasValidGpfSession();
  if (!authed) redirect("/gpf/login");
  return (
    <div style={{ minHeight: "100dvh" }}>
      <GpfNav />
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "16px" }}>{children}</main>
    </div>
  );
}
