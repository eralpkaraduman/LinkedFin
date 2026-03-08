import { ArrowLeftIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "#/components/ui/drawer";
import { useMediaQuery } from "#/hooks/useMediaQuery";

interface DetailModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onBack?: () => void;
	title: ReactNode;
	action?: ReactNode;
	children: ReactNode;
}

export function DetailModal({
	open,
	onOpenChange,
	onBack,
	title,
	action,
	children,
}: DetailModalProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					className="flex max-h-[85vh] flex-col gap-0 overflow-hidden sm:max-w-lg"
					showCloseButton={false}
				>
					<DialogHeader className="mb-4 shrink-0">
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								{onBack && (
									<button
										type="button"
										onClick={onBack}
										className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
									>
										<ArrowLeftIcon className="h-4 w-4" />
										<span className="sr-only">Back</span>
									</button>
								)}
								<DialogTitle>{title}</DialogTitle>
								{action}
							</div>
							<button
								type="button"
								onClick={() => onOpenChange(false)}
								className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
							>
								<XIcon className="h-4 w-4" />
								<span className="sr-only">Close</span>
							</button>
						</div>
					</DialogHeader>
					<div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent className="flex max-h-[calc(100vh-4rem)] flex-col">
				<DrawerHeader className="mb-4 shrink-0">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							{onBack && (
								<button
									type="button"
									onClick={onBack}
									className="shrink-0 cursor-pointer rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
								>
									<ArrowLeftIcon className="h-5 w-5" />
									<span className="sr-only">Back</span>
								</button>
							)}
							<div className="flex items-center gap-2">
								<DrawerTitle>{title}</DrawerTitle>
								{action}
							</div>
						</div>
						<DrawerClose
							className="cursor-pointer rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
						>
							<XIcon className="h-5 w-5" />
							<span className="sr-only">Close</span>
						</DrawerClose>
					</div>
				</DrawerHeader>
				<div className="safe-bottom min-h-0 flex-1 overflow-y-auto px-4 pb-4">
					{children}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
