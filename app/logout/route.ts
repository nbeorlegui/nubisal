import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
  cookieStore.delete("auth_session");
  cookieStore.delete("nubisal_session");

  redirect("/login");
}