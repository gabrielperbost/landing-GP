import { redirect } from "next/navigation";

// Ancienne adresse : la liste s'appelle désormais « Contacts ».
export default function AncienneListeClients() {
  redirect("/gpf/contacts");
}
