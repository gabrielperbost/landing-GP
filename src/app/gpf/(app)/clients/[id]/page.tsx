import { redirect } from "next/navigation";

export default function AncienneFicheClient({ params }: { params: { id: string } }) {
  redirect(`/gpf/contacts/${params.id}`);
}
