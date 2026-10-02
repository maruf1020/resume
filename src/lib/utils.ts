import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/** Prefix a public path with the configured basePath (needed for plain <a> tags and history URLs). */
export const withBase = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;

export const askPath = (intentId: string) => withBase(`/ask/${intentId}/`);

/** Plain text of an answer: strips the **bold** markers. */
export const plain = (text: string) => text.replace(/\*\*/g, "");
