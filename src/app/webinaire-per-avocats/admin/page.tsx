import type { Metadata } from "next";
import { WebinarAvocatsAdmin } from "@/components/pages/WebinarAvocatsAdmin";

export const metadata: Metadata = {
  title: "Participants webinaire PER avocats | GP Finances",
  robots: {
    index: false,
    follow: false
  }
};

export default function WebinarAvocatsAdminPage() {
  return <WebinarAvocatsAdmin />;
}
