"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

function Appheader() {
  const pathname = usePathname();

  // const menuoption = [
  //   {
  //     id: 1,
  //     name: "home",
  //     path: "/",
  //   },
  //   {
  //     id: 2,
  //     name: "history",
  //     path: "/history",
  //   },
  //   {
  //     id: 3,
  //     name: "pricing",
  //     path: "/pricing",
  //   },
  //   {
  //     id: 4,
  //     name: "profile",
  //     path: "/profile",
  //   },
  // ];

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        {/* Logo + app name */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-xl bg-neutral-900 p-2 dark:bg-neutral-100">
            <Image src="/logo.svg" alt="logo" width={28} height={28} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              AI Medical Voice Agent
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Clinical voice dashboard
            </span>
          </div>
        </div>

        {/* Navigation */}
        {/* <nav className="hidden items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-1 py-1 text-xs font-medium text-neutral-600 shadow-sm md:flex dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          {menuoption.map((option) => {
            const active = pathname === option.path;
            return (
              <Link
                key={option.id}
                href={option.path}
                className={`rounded-full px-3 py-1 transition ${
                  active
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "hover:bg-white hover:text-neutral-900 dark:hover:bg-neutral-800"
                }`}
              >
                {option.name}
              </Link>
            );
          })}
        </nav> */}

        {/* Right side placeholder (e.g., user / status) */}
        <div className="hidden items-center gap-2 md:flex">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
           <UserButton/>
          </span>
        </div>
      </div>
    </header>
  );
}

export default Appheader;