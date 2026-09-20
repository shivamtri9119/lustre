import { redirect } from "next/navigation";

// Every salon now has its own booking link at /book/<slug>. There is no
// generic booking page any more — one page can't know which salon a
// visitor means — so this just sends anyone who lands here to the homepage.
export default function BookIndexPage() {
  redirect("/");
}
