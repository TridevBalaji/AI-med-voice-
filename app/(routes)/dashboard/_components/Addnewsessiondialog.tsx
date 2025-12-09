"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import type { SpecialistConfig } from "@/shared/list";

function Addnewsessiondialog() {
  const router = useRouter();

  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"notes" | "suggestions">("notes");
  const [suggestedDoctors, setSuggestedDoctors] = useState<SpecialistConfig[]>(
    []
  );
  const [selectedDoctor, setSelectedDoctor] =
    useState<SpecialistConfig | null>(null);

  const onClickNext = async () => {
    if (!note) return;
    setLoading(true);
    try {
      const res = await axios.post("/api/suggest-doctors", {
        notes: note,
      });
      setSuggestedDoctors(res.data || []);
      setStep("suggestions");
    } catch (error) {
      console.error("Failed to suggest doctors", error);
    } finally {
      setLoading(false);
    }
  };

  const onStartConsultation = async () => {
    if (!note || !selectedDoctor) return;
    setLoading(true);
    try {
      const res = await axios.post("/api/session-chat", {
        notes: note,
        selectedDoctor: selectedDoctor.specialist,
      });

      const sessionId = res.data?.sessionId;
      if (sessionId) {
        router.push(`/dashboard/medical-agent/${sessionId}`);
      }
    } catch (error) {
      console.error("Failed to start consultation", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="mt-2 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            +
          </span>
          <span>Start conversation</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === "notes"
              ? "Add basic details"
              : "Choose the best specialist"}
          </DialogTitle>
          <DialogDescription asChild>
            {step === "notes" ? (
              <div className="mt-3 space-y-2">
                <h2 className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  Add symptoms or other details
                </h2>
                <Textarea
                  placeholder="Describe the patient's symptoms, history, and any concerns..."
                  className="mt-1 h-[200px] py-5"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Based on your note, these specialists may be a good fit. Pick
                  one to continue.
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {suggestedDoctors.map((doc) => {
                    const active = selectedDoctor?.id === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelectedDoctor(doc)}
                        className={`flex flex-col items-start gap-2 rounded-2xl border px-3 py-3 text-left text-xs transition ${
                          active
                            ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                            : "border-neutral-200 bg-white hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-neutral-500"
                        }`}
                      >
                        <div className="flex w-full flex-col items-center gap-2">
                          <div className="relative h-14 w-14 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
                            <Image
                              src={`/${doc.image}`}
                              alt={doc.specialist}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wide">
                              {doc.specialist}
                            </span>
                            <span className="line-clamp-3 text-[11px] opacity-80 text-center">
                              {doc.description}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex items-center justify-between gap-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          {step === "notes" ? (
            <Button disabled={!note || loading} onClick={onClickNext}>
              {loading && (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" aria-hidden />
              )}
              Next <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          ) : (
            <Button
              disabled={!selectedDoctor || loading}
              onClick={onStartConsultation}
            >
              {loading && (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" aria-hidden />
              )}
              Start consultation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Addnewsessiondialog;