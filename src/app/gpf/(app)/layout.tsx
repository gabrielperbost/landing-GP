import { redirect } from "next/navigation";
import { hasValidGpfSession } from "@/lib/gpf/auth";
import { GpfSidebar } from "@/components/gpf/GpfSidebar";

export default async function GpfAppLayout({ children }: { children: React.ReactNode }) {
  const authed = await hasValidGpfSession();
  if (!authed) redirect("/gpf/login");
  return (
    <div className="min-h-dvh md:flex bg-[#f7f8fa]">
      <GpfSidebar />
      <main className="flex-1 min-w-0 p-4 md:p-8 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}
