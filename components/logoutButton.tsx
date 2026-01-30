"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="border-primary text-primary hover:bg-primary hover:text-background"
    >
      Sair
    </Button>
  );
}