import { redirect } from "next/navigation";

export default function BoardRedirectPage() {
  redirect("/app/work?view=board");
}
