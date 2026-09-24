import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Montserrat } from "next/font/google";
import { ProLoanInsuranceSimulator } from "@/components/simulateur/ProLoanInsuranceSimulator";
import { SimulateurAccessGate } from "@/components/simulateur/SimulateurAccessGate";
import { isSimulateurAuthorizedFromCookieStore, isSimulateurPasswordConfigured } from "@/lib/simulateurAuth";

export const metadata: Metadata = {
  title: "Simulateur Assurance Pro | GP Finances (acces prive)",
  robots: {
    index: false,
    follow: false
  }
};

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"]
});

export default function TarificateurGpPage() {
  const cookieStore = cookies();
  const isAuthorized = isSimulateurAuthorizedFromCookieStore(cookieStore);
  const isConfigured = isSimulateurPasswordConfigured();

  return (
    <main className={montserrat.variable}>
      {isAuthorized ? <ProLoanInsuranceSimulator /> : <SimulateurAccessGate isConfigured={isConfigured} />}
    </main>
  );
}
