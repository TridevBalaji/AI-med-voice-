import { specialists } from "@/shared/list";
import React from "react";
import Doctorcard from "./doctorcard";

function DoctorList() {
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          Specialist doctors
        </h2>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Choose a profile to start a tailored consultation.
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {specialists.map((doctor) => (
          <Doctorcard key={doctor.id} doctorAgent={doctor} />
        ))}
      </div>
    </div>
  );
}

export default DoctorList;