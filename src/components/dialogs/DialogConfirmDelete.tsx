import type {
	ComponentRenderFn,
	DialogTriggerState,
	HTMLProps,
} from "@base-ui/react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface DialogConfirmProps {
	open?: boolean;
	onOpenChange?: (_open: boolean) => void;
	title?: string;
	description?: string;
	onConfirm: () => void;
	onCancel?: () => void;
	type?: "trigger" | "state";
	trigger?:
		| React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>
		| ComponentRenderFn<HTMLProps, DialogTriggerState>;
	okText?: string;
	cancelText?: string;
	renderOkButton?: React.ReactNode;
	renderCancelButton?: React.ReactNode;
}

export default function DialogConfirm({
	title = "Xác nhận xóa",
	description = "Bạn có chắc chắn muốn xóa?",
	onConfirm,
	onCancel,
	open,
	onOpenChange,
	type = "state",
	trigger,
	okText = "Tiếp tục",
	cancelText = "Hủy",
	renderOkButton,
	renderCancelButton,
}: DialogConfirmProps) {
	if (!renderOkButton) {
		renderOkButton = <Button onClick={onConfirm}>{okText}</Button>;
	}

	if (!renderCancelButton) {
		renderCancelButton = (
			<Button variant="secondary" onClick={onCancel}>
				{cancelText}
			</Button>
		);
	}

	if (type === "trigger") {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogTrigger render={trigger} />
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>
					<div className="flex w-full items-center justify-end gap-2">
						<DialogClose
							render={
								renderCancelButton as React.ReactElement<HTMLProps<unknown>>
							}
						/>
						<DialogClose
							render={renderOkButton as React.ReactElement<HTMLProps<unknown>>}
						/>
					</div>
				</DialogContent>
			</Dialog>
		);
	}
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="flex w-full items-center justify-end gap-2">
					{renderCancelButton}
					{renderOkButton}
				</div>
			</DialogContent>
		</Dialog>
	);
}
