"use client";

import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from "react";

/** Dashboard (and similar) can register a top bar that spans main + right rail (L-shaped shell). */
export const ShellLHeaderSetterContext = createContext<Dispatch<SetStateAction<ReactNode | null>> | null>(
  null,
);

export function useShellLHeaderSetter(): Dispatch<SetStateAction<ReactNode | null>> | null {
  return useContext(ShellLHeaderSetterContext);
}
