"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function AuthHeader() {
  const router = useRouter();

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8 pt-8">
        <button
          onClick={() => router.back()}
          className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        <Link href="/" className="flex items-center gap-4">
          <Image src="/logo.svg" alt="FinTrack" width={40} height={40} />
          <h1 className="text-3xl font-bold text-primary cursor-pointer">FinTrack</h1>
        </Link>
      </div>
    </div>
  );
}
