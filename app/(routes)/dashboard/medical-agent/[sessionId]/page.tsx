"use client";

import { specialists, type SpecialistConfig } from "@/shared/list";
import axios from "axios";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { PhoneCall, PhoneOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Vapi from '@vapi-ai/web';

type SessionDetail = {
  id: number;
  sessionId: string;
  createdBy: string;
  notes: string;
  selectedDoctor: string; // specialist name
  createdOn: string;
};

type TranscriptMessage = {
  role: string;
  text: string;
  timestamp: number;
};

type MedicalReport = {
  sessionId: string;
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
};

function MedicalAgent() {
  const { sessionId } = useParams();
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [callStarted, setCallStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]); // Previous completed messages
  const [currentMessage, setCurrentMessage] = useState<string>(""); // Assistant streaming text
  const [currentRole, setCurrentRole] = useState<string>(""); // Current streaming role
  const [callDuration, setCallDuration] = useState(0);
  const [report, setReport] = useState<MedicalReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const vapiRef = useRef<Vapi | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const currentMessageRef = useRef<string>("");
  const currentRoleRef = useRef<string>("");
  const callStartedRef = useRef<boolean>(false);
  const messagesRef = useRef<TranscriptMessage[]>([]);
  const sessionDetailRef = useRef<SessionDetail | null>(null);
  const sessionIdRef = useRef<string | string[] | undefined>(sessionId);
  const callDurationRef = useRef<number>(0);

  // Initialize Vapi once
  useEffect(() => {
    // Prevent duplicate initialization
    if (vapiRef.current) {
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    if (!apiKey || !assistantId) {
      console.error('Missing Vapi environment variables');
      return;
    }

    const vapi = new Vapi(apiKey);
    vapiRef.current = vapi;

    // Set up event listeners once
    vapi.on('call-start', () => {
      console.log('Call started');
      callStartedRef.current = true;
      setCallStarted(true);
      setCallDuration(0);
      setMessages([]);
      messagesRef.current = [];
      setCurrentMessage("");
      setCurrentRole("");
      currentMessageRef.current = "";
      currentRoleRef.current = "";
      // Start timer
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => {
          const newDuration = prev + 1;
          callDurationRef.current = newDuration;
          return newDuration;
        });
      }, 1000);
    });

    vapi.on('call-end', async () => {
      console.log('Call ended');
      callStartedRef.current = false;
      setCallStarted(false);
      setIsSpeaking(false);
      // Save any remaining current message before clearing
      if (currentMessageRef.current && currentRoleRef.current) {
        const newMessage = {
          role: currentRoleRef.current,
          text: currentMessageRef.current,
          timestamp: Date.now(),
        };
        setMessages((prev) => {
          const updated = [...prev, newMessage];
          messagesRef.current = updated;
          return updated;
        });
      }
      
      const finalMessages = [
        ...messagesRef.current,
        ...(currentMessageRef.current && currentRoleRef.current
          ? [
              {
                role: currentRoleRef.current,
                text: currentMessageRef.current,
                timestamp: Date.now(),
              },
            ]
          : []),
      ];

      setCurrentMessage("");
      setCurrentRole("");
      currentMessageRef.current = "";
      currentRoleRef.current = "";
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const finalDuration = callDurationRef.current;
      setCallDuration(0);
      callDurationRef.current = 0;

      // Generate report if there are messages
      if (finalMessages.length > 0 && sessionDetailRef.current) {
        setGeneratingReport(true);
        try {
          const doctorConfig = specialists.find(
            (s) => s.specialist === sessionDetailRef.current?.selectedDoctor
          );
          const agentName = doctorConfig
            ? `${doctorConfig.specialist} AI`
            : "AI Medical Voice Agent";

          const response = await axios.post("/api/generate-report", {
            sessionId: sessionIdRef.current as string,
            agent: agentName,
            messages: finalMessages,
            callDuration: finalDuration,
          });

          setReport(response.data);
        } catch (error) {
          console.error("Failed to generate report:", error);
        } finally {
          setGeneratingReport(false);
        }
      }
    });

    vapi.on('speech-start', () => {
      console.log('Assistant started speaking');
      setIsSpeaking(true);
    });

    vapi.on('speech-end', () => {
      console.log('Assistant stopped speaking');
      setIsSpeaking(false);
    });

    vapi.on('message', (message: { 
      type?: string; 
      role?: string; 
      transcript?: string;
      transcriptType?: string;
    }) => {
      if (message.type === 'transcript' && message.role && message.transcript) {
        const { role, transcriptType, transcript } = message;
        
        // Handle partial transcripts - accumulate chunks into currentMessage
        if (transcriptType === 'partial') {
          // Vapi sends cumulative partials (full text so far), so we use it directly
          setCurrentMessage(transcript);
          setCurrentRole(role);
          currentMessageRef.current = transcript;
          currentRoleRef.current = role;
        } 
        // Handle final transcripts - finish the message and save to messages array
        else if (transcriptType === 'final') {
          // Final transcript - save current message to messages array
          const newMessage = {
            role: role!,
            text: transcript!,
            timestamp: Date.now(),
          };
          setMessages((prev) => {
            const updated = [...prev, newMessage];
            messagesRef.current = updated;
            return updated;
          });
          // Clear current message buffer
          setCurrentMessage("");
          setCurrentRole("");
          currentMessageRef.current = "";
          currentRoleRef.current = "";
        }
        // If transcriptType is missing or unknown, treat as partial to be safe
        else {
          // Fallback: treat as partial to avoid adding incomplete messages
          setCurrentMessage(transcript);
          setCurrentRole(role);
          currentMessageRef.current = transcript;
          currentRoleRef.current = role;
        }
      }
    });

    vapi.on('error', (error: unknown) => {
      console.error('Vapi error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (vapiRef.current) {
        try {
          // Stop any active call
          if (callStartedRef.current) {
            vapiRef.current.stop();
          }
          // Remove all event listeners to prevent memory leaks
          vapiRef.current.removeAllListeners?.();
        } catch (error) {
          console.error('Error cleaning up Vapi:', error);
        }
        vapiRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const startCall = () => {
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!vapiRef.current || !assistantId) {
      console.error('Vapi not initialized or missing assistant ID');
      return;
    }
// const vapiconfig = {
//   name:'AI Medical Voice Agent',
//   firstMessage:'Hello, I am your AI Medical Voice Agent. How can I help you today?',
//   transcriber:{
//     provider:'assembly-ai',
//     language:'multi',
//   },
//   voice:{
//     provider:'vapi',
//     voiceId:sessionDetail?.selectedDoctor?.voiceId,
//   },
//   model:{
//     provider:'openai',
//     model:'gpt-4',
//     messages:[{role:'system',content:sessionDetail?.selectedDoctor?.agentPrompt}],
//   }
// }
    try {
      vapiRef.current.start(assistantId);
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const stopCall = () => {
    if (vapiRef.current) {
      try {
        // Save any remaining current message before stopping
        if (currentMessageRef.current && currentRoleRef.current) {
          setMessages((prev) => [
            ...prev,
            {
              role: currentRoleRef.current,
              text: currentMessageRef.current,
              timestamp: Date.now(),
            },
          ]);
        }
        vapiRef.current.stop();
        callStartedRef.current = false;
        setCallStarted(false);
        setIsSpeaking(false);
        setCurrentMessage("");
        setCurrentRole("");
        currentMessageRef.current = "";
        currentRoleRef.current = "";
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setCallDuration(0);
      } catch (error) {
        console.error('Failed to stop call:', error);
      }
    }
  };

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  useEffect(() => {
    sessionIdRef.current = sessionId;
    const getSessionDetails = async () => {
      const res = await axios.get(
        "/api/session-chat?sessionId=" + sessionId
      );
      setSessionDetail(res.data);
      sessionDetailRef.current = res.data;
    };

    const getReport = async () => {
      try {
        const res = await axios.get(`/api/reports?sessionId=${sessionId}`);
        setReport(res.data);
      } catch (error) {
        // Report might not exist yet, that's okay
        console.log("No report found for this session yet");
      }
    };

    if (sessionId) {
      getSessionDetails();
      getReport();
    }
  }, [sessionId]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentMessage]);

  const doctorConfig: SpecialistConfig | undefined = useMemo(() => {
    if (!sessionDetail) return undefined;
    return specialists.find(
      (s) => s.specialist === sessionDetail.selectedDoctor
    );
  }, [sessionDetail]);

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-6">
      <div className="relative flex w-full max-w-5xl flex-col items-center rounded-3xl border border-neutral-200 bg-white px-6 py-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        {/* Top status + timer */}
        <div className="mb-16 flex w-full items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1">
            <span
              className={`inline-block size-3 rounded-full border ${
                callStarted
                  ? "bg-green-500 border-green-500"
                  : "bg-red-500 border-red-500"
              }`}
            />
            <span>{callStarted ? "Connected" : "Not connected"}</span>
          </div>
          <span className="font-semibold text-neutral-400">
            {formatTime(callDuration)}
          </span>
        </div>

        {/* Center doctor avatar + name */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
            {doctorConfig ? (
              <Image
                src={`/${doctorConfig.image}`}
                alt={doctorConfig.specialist}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-500">
                ?
              </div>
            )}
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {doctorConfig?.specialist || "Doctor"}
          </h2>
          <p className="text-sm text-neutral-400">AI Medical Voice Agent</p>
        </div>

        {/* Live Transcript Display */}
        <div className="mt-12 w-full max-w-2xl">
          <div className="mb-4 flex items-center justify-center gap-2">
            {isSpeaking && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
                <Mic className="h-3 w-3" />
                <span>Assistant Speaking...</span>
              </div>
            )}
            {callStarted && !isSpeaking && (
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <MicOff className="h-3 w-3" />
                <span>Listening...</span>
              </div>
            )}
          </div>

          <div className="max-h-[300px] space-y-3 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
            {messages.length === 0 && !currentMessage ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-neutral-400">
                  {callStarted
                    ? "Conversation will appear here..."
                    : "Start a call to see the conversation transcript"}
                </p>
              </div>
            ) : (
              <>
                {/* Previous completed messages */}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                          : "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50"
                      }`}
                    >
                      <div className="mb-1 text-xs font-medium opacity-70">
                        {msg.role === "user" ? "You" : "Assistant"}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  </div>
                ))}
                
                {/* Live/streaming message - ONE bubble for ongoing message */}
                {currentMessage && currentRole === "assistant" && (
                  <div 
                    key="live-assistant-message" 
                    className="flex justify-start"
                  >
                    <div className="max-w-[80%] rounded-2xl bg-neutral-200 px-4 py-2 text-sm shadow-sm opacity-75 dark:bg-neutral-700 dark:text-neutral-300">
                      <div className="mb-1 flex items-center gap-1 text-xs font-medium opacity-70">
                        <span>Assistant</span>
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current"></span>
                        <span className="text-[10px]">speaking...</span>
                      </div>
                      <div className="whitespace-pre-wrap break-words text-neutral-800 dark:text-neutral-200">
                        {currentMessage}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Medical Report Section */}
        {(generatingReport || report) && (
          <div className="mt-12 w-full max-w-2xl">
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Medical Report
              </h3>
              
              {generatingReport ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-neutral-100"></div>
                    <p className="text-sm text-neutral-500">Generating report...</p>
                  </div>
                </div>
              ) : report ? (
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-neutral-600 dark:text-neutral-400">Session ID:</span>
                      <p className="text-neutral-900 dark:text-neutral-50">{report.sessionId}</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-600 dark:text-neutral-400">Agent:</span>
                      <p className="text-neutral-900 dark:text-neutral-50">{report.agent}</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-600 dark:text-neutral-400">Patient:</span>
                      <p className="text-neutral-900 dark:text-neutral-50">{report.user}</p>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-600 dark:text-neutral-400">Date:</span>
                      <p className="text-neutral-900 dark:text-neutral-50">
                        {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Chief Complaint */}
                  <div>
                    <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Chief Complaint</h4>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{report.chiefComplaint}</p>
                  </div>

                  {/* Summary */}
                  <div>
                    <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Summary</h4>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{report.summary}</p>
                  </div>

                  {/* Symptoms */}
                  {report.symptoms && report.symptoms.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Symptoms</h4>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                        {report.symptoms.map((symptom: string, idx: number) => (
                          <li key={idx}>{symptom}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Duration & Severity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Duration</h4>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">{report.duration}</p>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Severity</h4>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 capitalize">{report.severity}</p>
                    </div>
                  </div>

                  {/* Medications */}
                  {report.medicationsMentioned && report.medicationsMentioned.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Medications Mentioned</h4>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                        {report.medicationsMentioned.map((med: string, idx: number) => (
                          <li key={idx}>{med}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {report.recommendations && report.recommendations.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-50">Recommendations</h4>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
                        {report.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Start call button */}
        <div className="mt-16 flex justify-center">
          {!callStarted ? (
            <Button
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
              onClick={startCall}
            >
              <PhoneCall className="h-4 w-4" />
              Start Call
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium"
              onClick={stopCall}
            >
              <PhoneOff className="h-4 w-4" />
              Disconnect Call
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MedicalAgent;