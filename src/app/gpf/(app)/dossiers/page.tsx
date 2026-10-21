import { redirect } from "next/navigation";

// Ancienne adresse : les affaires en cours sont dans « Commercial ».
export default function AncienneListeDossiers() {
  redirect("/gpf/commercial");
}
