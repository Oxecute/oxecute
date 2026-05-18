"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Mobile L-shell: FAB opens bottom sheet with the same content as the desktop right rail. */
export function MobileShellRailDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    sheetRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        className={
          "fixed z-[35] flex items-center gap-2 rounded-full border border-white/[0.12] " +
          "bg-[#181b24] px-4 py-2.5 text-[12px] font-semibold text-[#EAEFF8] shadow-[0_4px_20px_rgba(0,0,0,0.45)] " +
          "hover:bg-[#1c1f2a] right-[max(0.75rem,env(safe-area-inset-right))] " +
          "bottom-[max(0.85rem,env(safe-area-inset-bottom))]"
        }
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="h-4 w-4 shrink-0 text-[#0EA472]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Journey
      </button>

      {open ? (
        <div className="fixed inset-0 z-[45] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            aria-label="Close Journey panel"
            onClick={() => {
              close();
              fabRef.current?.focus();
            }}
          />
          <div
            ref={sheetRef}
            id={id}
            role="dialog"
            aria-modal="true"
            aria-label="Journey and Conexa"
            tabIndex={-1}
            className={
              "absolute inset-x-0 bottom-0 z-[46] max-h-[min(72dvh,560px)] overflow-hidden rounded-t-[20px] " +
              "border-t border-white/[0.1] bg-[var(--shell-bg)] shadow-[0_-8px_40px_rgba(0,0,0,0.5)] flex flex-col outline-none"
            }
          >
            <div className="flex shrink-0 justify-center pt-2 pb-1">
              <span className="h-1 w-10 rounded-full bg-white/15" aria-hidden />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1">
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
