import { redirect } from "next/navigation";

export default function ListRedirectPage() {
  redirect("/app/work?view=list");
}
