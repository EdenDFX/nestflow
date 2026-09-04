import type { LibrarySoundName, SoundOptions } from "react-sounds";

/**
 * NestFlow feedback categories mapped onto react-sounds library IDs.
 * Keep this list small so the app stays sparse and consistent.
 */
export type AppSoundCategory =
  | "click"
  | "confirm"
  | "delete"
  | "reject"
  | "error"
  | "timer"
  | "timerComplete"
  | "island"
  | "taskNotification"
  | "taskUpdate"
  | "toggleOn"
  | "toggleOff";

type SoundEntry = {
  name: LibrarySoundName;
  options?: SoundOptions;
};

export const APP_SOUND_CATALOG: Record<AppSoundCategory, SoundEntry> = {
  click: { name: "ui/button_soft", options: { volume: 0.35 } },
  confirm: { name: "notification/success", options: { volume: 0.45 } },
  delete: { name: "system/trash", options: { volume: 0.5 } },
  reject: { name: "ui/blocked", options: { volume: 0.4 } },
  error: { name: "notification/error", options: { volume: 0.5 } },
  timer: { name: "ui/toggle_on", options: { volume: 0.4 } },
  timerComplete: { name: "notification/completed", options: { volume: 0.55 } },
  island: { name: "notification/popup", options: { volume: 0.4 } },
  taskNotification: { name: "notification/popup", options: { volume: 0.5 } },
  taskUpdate: { name: "ui/success_blip", options: { volume: 0.4 } },
  toggleOn: { name: "ui/toggle_on", options: { volume: 0.4 } },
  toggleOff: { name: "ui/toggle_off", options: { volume: 0.4 } },
};

/** Sounds worth warming after first user gesture. */
export const APP_SOUND_PRELOAD: LibrarySoundName[] = [
  APP_SOUND_CATALOG.click.name,
  APP_SOUND_CATALOG.confirm.name,
  APP_SOUND_CATALOG.delete.name,
  APP_SOUND_CATALOG.reject.name,
  APP_SOUND_CATALOG.error.name,
  APP_SOUND_CATALOG.timer.name,
  APP_SOUND_CATALOG.timerComplete.name,
  APP_SOUND_CATALOG.island.name,
  APP_SOUND_CATALOG.taskNotification.name,
  APP_SOUND_CATALOG.taskUpdate.name,
  APP_SOUND_CATALOG.toggleOn.name,
  APP_SOUND_CATALOG.toggleOff.name,
];
