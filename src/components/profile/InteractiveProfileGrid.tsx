"use client";

import { useState } from "react";
import { ExecutionGrid } from "./ProfileSections";

type EntryTile = {
  day_number: number;
  tier: string | null;
  category?: string;
  url?: string | null;
  created_at?: string;
};

export default function InteractiveProfileGrid({
  entries,
  breakDays,
  userCreatedAt,
  maxDays = 30,
}: {
  entries: EntryTile[];
  breakDays: number[];
  userCreatedAt: string;
  maxDays?: number;
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
  };

  const closeModal = () => {
    setSelectedDay(null);
  };

  let modalContent = null;
  if (selectedDay !== null) {
    const ent = entries.find((e) => Number(e.day_number) === selectedDay);
    const isBreak = breakDays.includes(selectedDay);
    
    // Calculate date
    const start = new Date(userCreatedAt);
    const targetDate = new Date(start.getTime() + (selectedDay - 1) * 24 * 60 * 60 * 1000);
    const formattedDate = targetDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    let title = `Day ${selectedDay}`;
    const categoryText = ent?.category ? ent.category.charAt(0).toUpperCase() + ent.category.slice(1) : "";
    let body = "";
    let link = "";
    let badgeBg = "bg-zinc-800 text-zinc-300";
    let badgeText = "Empty";

    if (ent) {
      if (ent.tier === "signup_execution") {
        title = "Day 1 Activation";
        badgeBg = "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400";
        badgeText = "Signup";
        body = "Day 1 · Signed up and activated Conexa. Record starts here.";
      } else if (ent.tier === "verified_proof") {
        title = `Day ${selectedDay} verified proof`;
        badgeBg = "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300";
        badgeText = "Verified Proof";
        body = `Verified proof submitted in category: ${categoryText}.`;
        if (ent.url) {
          link = ent.url;
        }
      } else if (ent.tier === "declaration_pending") {
        title = `Day ${selectedDay} commitment`;
        badgeBg = "bg-violet-500/10 border border-violet-500/30 text-violet-400";
        badgeText = "Declaration";
        body = "Declaration pending upgrade. The stated commitment text is private to the founder.";
      } else if (ent.tier === "upload_unverified") {
        title = `Day ${selectedDay} submission`;
        badgeBg = "bg-amber-500/10 border border-amber-500/30 text-amber-400";
        badgeText = "File Upload";
        body = "Unverified file upload. Uploaded proof files are private to the founder.";
      }
    } else if (isBreak) {
      title = `Day ${selectedDay} record gap`;
      badgeBg = "bg-red-500/10 border border-red-500/30 text-red-400";
      badgeText = "Break";
      body = "No submission on this day. This gap is part of their record.";
    } else {
      title = `Day ${selectedDay}`;
      badgeBg = "bg-zinc-500/10 border border-zinc-500/20 text-zinc-400";
      badgeText = "Not yet";
      body = `Day ${selectedDay} · Not yet.`;
    }

    modalContent = (
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={closeModal}
      >
        <div 
          className="relative bg-[#0d0f1a] border border-white/[0.11] rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            type="button"
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            onClick={closeModal}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div className="space-y-1.5 pr-6">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeBg}`}>
              {badgeText}
            </span>
            <h3 className="text-lg font-bold text-white font-sans" style={{ fontFamily: "var(--font-urbanist), Urbanist, sans-serif" }}>
              {title}
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              {formattedDate}
            </p>
          </div>

          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-sm text-zinc-300 leading-relaxed">
              {body}
            </p>

            {link && (
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <span className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Verified proof url
                </span>
                <a 
                  href={link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DEF408] hover:text-white transition-colors break-all bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-full justify-between group"
                >
                  <span className="truncate flex-1 text-left">{link}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ExecutionGrid
        entries={entries}
        breakDays={breakDays}
        maxDays={maxDays}
        onDayClick={handleDayClick}
      />
      {modalContent}
    </>
  );
}
