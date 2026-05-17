import { redirect } from "next/navigation";

/** Network routes stay in nav (locked) but are not browseable yet. */
export default function CoachesPage() {
  redirect("/dashboard");
}
