"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "@/components/icons"

const toastIconClass = "h-4 w-4 shrink-0"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className={toastIconClass} />,
        info: <InfoIcon className={toastIconClass} />,
        warning: <TriangleAlertIcon className={toastIconClass} />,
        error: <OctagonXIcon className={toastIconClass} />,
        loading: <Loader2Icon className={`${toastIconClass} animate-spin`} />,
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
          toast:
            "group toast !items-start !gap-3 !py-3 !px-4 group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          title: "text-sm font-medium leading-snug",
          description: "text-sm text-muted-foreground leading-snug",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
