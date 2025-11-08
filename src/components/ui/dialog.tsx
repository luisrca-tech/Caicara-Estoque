
"use client"

import { X } from "lucide-react"
import type { ComponentPropsWithoutRef, HTMLAttributes } from "react"
import React, { createContext, useContext, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { cn } from "~/lib/utils"

type DialogContextValue = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined)

const useDialogContext = () => {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components should be used within a Dialog")
  }
  return context
}

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => (
  <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>
)

type DialogContentProps = ComponentPropsWithoutRef<"div">

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = useDialogContext()
    const [mounted, setMounted] = useState(false)
    const portalRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
      const portalNode = document.createElement("div")
      portalRef.current = portalNode
      document.body.appendChild(portalNode)
      setMounted(true)

      return () => {
        if (portalRef.current) {
          document.body.removeChild(portalRef.current)
        }
      }
    }, [])

    if (!open || !mounted || !portalRef.current) {
      return null
    }

    const handleClose = () => onOpenChange(false)

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
          role="presentation"
        />
        <div
          ref={ref}
          className={cn(
            "relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl duration-200 animate-in fade-in-0 zoom-in-95",
            className,
          )}
          {...props}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="sr-only">Close</span>
            <X className="size-4" />
          </button>
          {children}
        </div>
      </div>,
      portalRef.current,
    )
  },
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DialogDescription.displayName = "DialogDescription"

interface DialogCloseProps extends ComponentPropsWithoutRef<"button"> {}

const DialogClose = ({ className, children, ...props }: DialogCloseProps) => {
  const { onOpenChange } = useDialogContext()

  return (
    <button
      type="button"
      className={cn("rounded-md transition-opacity hover:opacity-80", className)}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {children}
    </button>
  )
}

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose }

