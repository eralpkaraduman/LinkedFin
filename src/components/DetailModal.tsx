import type { ReactNode } from "react"
import { XIcon } from "lucide-react"
import { useMediaQuery } from "#/hooks/useMediaQuery"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "#/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "#/components/ui/drawer"

interface DetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
}

export function DetailModal({
  open,
  onOpenChange,
  title,
  description,
  action,
  children,
}: DetailModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <div className="pr-8">
              <div className="flex items-center gap-2">
                <DialogTitle>{title}</DialogTitle>
                {action}
              </div>
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </div>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[calc(100vh-4rem)]">
        <DrawerHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <DrawerTitle>{title}</DrawerTitle>
                {action}
              </div>
              {description && (
                <DrawerDescription>{description}</DrawerDescription>
              )}
            </div>
            <DrawerClose className="cursor-pointer rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <XIcon className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="safe-bottom overflow-y-auto px-4 pb-4">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}
