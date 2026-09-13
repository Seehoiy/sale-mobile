"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    router.replace(session ? "/menu" : "/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-muted text-sm">
      ກຳລັງໂຫຼດ...
    </div>
  );
}
