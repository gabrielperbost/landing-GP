import type { Metadata } from "next";
import { PerPhoneCallbackForm } from "@/components/pages/PerPhoneCallbackForm";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = {
  title: "Me faire rappeler | GP Finances",
  description: "Indiquez votre numéro de téléphone pour être rappelé par Gabriel PERBOST.",
  robots: {
    index: false,
    follow: false
  }
};

const firstParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default function PerCallbackPage({ searchParams }: { searchParams?: SearchParams }) {
  return (
    <PerPhoneCallbackForm
      itemId={firstParam(searchParams?.item)}
      email={firstParam(searchParams?.email)}
      token={firstParam(searchParams?.token)}
    />
  );
}
