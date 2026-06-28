import { redirect } from "next/navigation";

// /settings → redirect to /settings/profile
export default function SettingsPage() {
  redirect("/settings/profile");
}
