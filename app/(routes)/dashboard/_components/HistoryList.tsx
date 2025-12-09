"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Addnewsessiondialog from './Addnewsessiondialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type MedicalReport = {
  id: number;
  sessionId: string;
  createdBy: string;
  agent: string;
  user: string;
  timestamp: string;
  chiefComplaint: string;
  summary: string;
  symptoms: string[];
  duration: string;
  severity: string;
  medicationsMentioned: string[];
  recommendations: string[];
  createdOn: string;
};

function HistoryList() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get("/api/reports");
        setReports(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const isEmpty = !loading && reports.length === 0;

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) {
        return 'just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      return dateString;
    }
  };

  const handleViewReport = (report: MedicalReport) => {
    setSelectedReport(report);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-neutral-100"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center dark:border-neutral-700 dark:bg-neutral-950">
          <div className="rounded-full bg-white p-3 shadow-sm dark:bg-neutral-900">
            <svg
              className="h-14 w-14 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
            No medical reports yet
          </h2>
          <p className="max-w-sm text-xs text-neutral-500 dark:text-neutral-400">
            Start a new consultation to see medical reports appear here for quick follow‑up and review.
          </p>
          <Addnewsessiondialog />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  AI Medical Specialist
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-neutral-200 bg-white transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                >
                  <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-50">
                    {report.agent}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {report.chiefComplaint || report.summary.substring(0, 50) + '...'}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                    {formatRelativeTime(report.createdOn)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(report)}
                      className="text-xs"
                    >
                      View Report
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Report Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medical Report</DialogTitle>
            <DialogDescription>
              Detailed medical consultation report
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Session ID:</span>
                  <p className="text-neutral-900 dark:text-neutral-50">{selectedReport.sessionId}</p>
                </div>
                <div>
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Agent:</span>
                  <p className="text-neutral-900 dark:text-neutral-50">{selectedReport.agent}</p>
                </div>
                <div>
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Patient:</span>
                  <p className="text-neutral-900 dark:text-neutral-50">{selectedReport.user}</p>
                </div>
                <div>
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">Date:</span>
                  <p className="text-neutral-900 dark:text-neutral-50">
                    {new Date(selectedReport.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Chief Complaint</h4>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedReport.chiefComplaint}</p>
              </div>

              {/* Summary */}
              <div>
                <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Summary</h4>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedReport.summary}</p>
              </div>

              {/* Symptoms */}
              {selectedReport.symptoms && selectedReport.symptoms.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Symptoms</h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                    {selectedReport.symptoms.map((symptom: string, idx: number) => (
                      <li key={idx}>{symptom}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Duration & Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Duration</h4>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{selectedReport.duration}</p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Severity</h4>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 capitalize">{selectedReport.severity}</p>
                </div>
              </div>

              {/* Medications */}
              {selectedReport.medicationsMentioned && selectedReport.medicationsMentioned.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Medications Mentioned</h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                    {selectedReport.medicationsMentioned.map((med: string, idx: number) => (
                      <li key={idx}>{med}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Recommendations</h4>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                    {selectedReport.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HistoryList;