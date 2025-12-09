import React from "react";
import HistoryList from "./_components/HistoryList";
import DoctorList from "./_components/DoctorList";
import Addnewsessiondialog from "./_components/Addnewsessiondialog";

function Dashboard() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 md:text-2xl">
            Workspace
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Review previous consultations or start a new AI-assisted session.
          </p>
        </div>
       <Addnewsessiondialog/>
      </div>

      {/* History section */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h3 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Recent sessions
        </h3>
        <HistoryList />
        <DoctorList/>
      </div>
    </div>
  );
}

export default Dashboard;