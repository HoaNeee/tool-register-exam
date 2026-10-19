import { Dialog, DialogContent } from "../ui/dialog";

interface Props {
	myIp: string;
	open: boolean;
	setOpen: (_open: boolean) => void;
}

export default function DialgoShowIp({ myIp, open, setOpen }: Props) {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<div>{myIp}</div>
			</DialogContent>
		</Dialog>
	);
}
