"use client"

import { useTheme } from "@wrksz/themes/client"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { BadgeAlertIcon } from "@/components/icons/badge-alert"
import { BanIcon } from "@/components/icons/ban"
import { CircleCheckIcon } from "@/components/icons/circle-check"
import { CircleHelpIcon } from "@/components/icons/circle-help"
import { LoaderCircleIcon } from "@/components/icons/loader-circle"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="inline-flex" />
        ),
        info: (
          <CircleHelpIcon className="inline-flex" />
        ),
        warning: (
          <BadgeAlertIcon className="inline-flex" />
        ),
        error: (
          <BanIcon className="inline-flex" />
        ),
        loading: (
          <LoaderCircleIcon className="inline-flex animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
