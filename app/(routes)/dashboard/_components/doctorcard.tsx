import { SpecialistConfig } from "@/shared/list";
import Image from "next/image";
import React from "react";

type Props = {
  doctorAgent: SpecialistConfig;
};

function Doctorcard({ doctorAgent }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-3">
        <div className="relative size-10 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
          <Image
            src={`/${doctorAgent.image}`}
            alt={doctorAgent.specialist}
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Specialist
          </span>
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {doctorAgent.specialist}
          </span>
        </div>
      </div>
      <p className="line-clamp-3 text-xs text-neutral-500 dark:text-neutral-400">
        {doctorAgent.description}
      </p>
      <button className="bg-black text-white px-4 py-2 rounded">
  Start Conversation
</button>

    </div>
  );
}

export default Doctorcard;