"use client";

import {
  toast as sonnerToast,
  type ExternalToast,
} from "sonner";

import { playAppSound } from "@/lib/sounds/play";

type Message = Parameters<typeof sonnerToast.success>[0];

export type AppToastData = ExternalToast & {
  /** Skip the category sound for this toast (avoids double-play with local SFX). */
  sound?: false;
};

function playUnlessSilent(
  category: "confirm" | "error" | "reject" | "click" | "taskUpdate",
  data?: AppToastData,
) {
  if (data?.sound === false) return;
  playAppSound(category);
}

function stripSound(data?: AppToastData): ExternalToast | undefined {
  if (!data) return undefined;
  const { sound: _sound, ...rest } = data;
  return rest;
}

function success(message: Message, data?: AppToastData): string | number {
  playUnlessSilent("confirm", data);
  return sonnerToast.success(message, stripSound(data));
}

function error(message: Message, data?: AppToastData): string | number {
  playUnlessSilent("error", data);
  return sonnerToast.error(message, stripSound(data));
}

function warning(message: Message, data?: AppToastData): string | number {
  playUnlessSilent("reject", data);
  return sonnerToast.warning(message, stripSound(data));
}

function info(message: Message, data?: AppToastData): string | number {
  playUnlessSilent("click", data);
  return sonnerToast.info(message, stripSound(data));
}

function message(value: Message, data?: AppToastData): string | number {
  return sonnerToast.message(value, stripSound(data));
}

/** Negative outcome that is intentional (cancel, reject), not a system error. */
function reject(value: Message, data?: AppToastData): string | number {
  playUnlessSilent("reject", data);
  return sonnerToast.warning(value, stripSound(data));
}

/** Soft task mutation feedback (status move, reschedule) distinct from create/save. */
function taskUpdate(value: Message, data?: AppToastData): string | number {
  playUnlessSilent("taskUpdate", data);
  return sonnerToast.success(value, stripSound(data));
}

type AppToast = {
  (message: Message, data?: AppToastData): string | number;
  success: typeof success;
  error: typeof error;
  warning: typeof warning;
  info: typeof info;
  message: typeof message;
  reject: typeof reject;
  taskUpdate: typeof taskUpdate;
  promise: typeof sonnerToast.promise;
  custom: typeof sonnerToast.custom;
  loading: typeof sonnerToast.loading;
  dismiss: typeof sonnerToast.dismiss;
  getHistory: typeof sonnerToast.getHistory;
  getToasts: typeof sonnerToast.getToasts;
};

export const toast: AppToast = Object.assign(
  (value: Message, data?: AppToastData) =>
    sonnerToast(value, stripSound(data)),
  {
    success,
    error,
    warning,
    info,
    message,
    reject,
    taskUpdate,
    promise: sonnerToast.promise,
    custom: sonnerToast.custom,
    loading: sonnerToast.loading,
    dismiss: sonnerToast.dismiss,
    getHistory: sonnerToast.getHistory,
    getToasts: sonnerToast.getToasts,
  },
);
