import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return NextResponse.json(
        { error: "Ein Fehler ist aufgetreten" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Logout erfolgreich" }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
