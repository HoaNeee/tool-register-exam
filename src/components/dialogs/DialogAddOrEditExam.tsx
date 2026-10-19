import type {
	ConfigExamTarget,
	IDiaDiem,
	IKyThiChuaDienRa,
} from "@/types/types";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Field, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { useEffect, useRef, useState } from "react";
import { examRemoteService } from "@/services/exam-remote-service";
import { handleExceptionGlobal } from "@/utils/exception";
import { authService } from "@/services/auth-service";

interface Props {
	open: boolean;
	onOpenChange: (_o: boolean) => void;
	mode: "add" | "edit";
	listDiaDiemThi: IDiaDiem[];
	onSubmit?: (_payload: ConfigExamTarget) => void;
	configExam?: ConfigExamTarget;
}

export function DialogAddOrEditExam({
	open,
	onOpenChange,
	mode = "add",
	listDiaDiemThi,
	onSubmit,
	configExam,
}: Props) {
	const [maDiaDiemThi, setMaDiaDiemThi] = useState("");
	const [examSelected, setExamSelected] = useState<IKyThiChuaDienRa | null>(
		null,
	);

	const [listKyThi, setListKyThi] = useState<IKyThiChuaDienRa[]>([]);
	const [error, setError] = useState("");

	const formRef = useRef<HTMLFormElement>(null);

	const handleSelectDiaDiemThi = async (code: string) => {
		try {
			const list = await examRemoteService.getKyThiChuaDienRa({
				diaDiemCode: code,
				hasRegisterCode: 0,
			});
			setListKyThi(list);
			setMaDiaDiemThi(code);
		} catch (error) {
			handleExceptionGlobal(error);
		}
	};

	useEffect(() => {
		async function fn() {
			if (mode === "edit" && configExam && configExam.exam_register) {
				await handleSelectDiaDiemThi(configExam.exam_register.dia_diem_code);
				setExamSelected(configExam.exam_register);
			}
		}
		fn();
	}, [configExam, mode]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		try {
			if (!formRef.current) return;

			const formData = new FormData(formRef.current);

			const cccd = formData.get("cccd");
			if (!cccd) {
				setError("Vui lòng nhập CCCD");
				return;
			}

			const pass = formData.get("password");
			if (!pass) {
				setError("Vui lòng nhập mật khẩu");
				return;
			}

			if (!examSelected) {
				setError("Vui lòng chọn kỳ thi");
				return;
			}

			let payload: Partial<ConfigExamTarget> = {};

			if (mode === "edit" && configExam) {
				payload = configExam;
			}

			async function updateAuth() {
				const res = await authService.login(cccd as string, pass as string);
				const auth = {
					token: res.token,
					session: res.session,
					password: pass.toString(),
				};

				const thong_tin_ca_nhan = await authService.getMe(auth);
				payload["thong_tin_ca_nhan"] = thong_tin_ca_nhan;
				payload["auth"] = auth;
			}

			if (mode === "add") {
				await updateAuth();
			} else {
				if (configExam) {
					if (
						configExam.thong_tin_ca_nhan.cccd.cccd !== cccd ||
						configExam.auth.password !== pass
					) {
						await updateAuth();
					} else {
						payload["auth"] = configExam.auth;
						payload["thong_tin_ca_nhan"] = configExam.thong_tin_ca_nhan;
					}
				}
			}

			payload["exam_register"] = examSelected;

			onSubmit?.(payload as ConfigExamTarget);
		} catch (error) {
			handleExceptionGlobal(error);
		}
	}

	const handleGetCapDoThi = () => {
		if (examSelected) {
			return examSelected.ma_cap_thi + " " + examSelected.ngay_mo_dang_ky;
		}

		return null;
	};

	if (mode === "edit" && !configExam) return null;

	const DEFAULT_CCCD = "";
	const DEFAULT_PASS = "";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{mode === "add" ? "Thêm cấu hình đăng ký" : "Chỉnh sửa cấu hình"}
					</DialogTitle>
					<DialogDescription>
						{mode === "add"
							? "Thêm cấu hình đăng ký mới"
							: "Cập nhật cấu hình đăng ký"}
					</DialogDescription>
				</DialogHeader>
				<form className="" onSubmit={handleSubmit} ref={formRef}>
					<FieldGroup className="pb-6">
						<Field>
							<FieldLabel>CCCD</FieldLabel>
							<Input
								name="cccd"
								defaultValue={
									configExam?.thong_tin_ca_nhan?.cccd.cccd || DEFAULT_CCCD
								}
							/>
						</Field>
						<Field>
							<FieldLabel>Mật Khẩu</FieldLabel>
							<Input
								name="password"
								type="password"
								defaultValue={configExam?.auth.password || DEFAULT_PASS}
							/>
						</Field>
						<Field>
							<FieldLabel>Địa điểm thi</FieldLabel>
							<Select
								onValueChange={(value) => {
									handleSelectDiaDiemThi(value as string);
									setExamSelected(null);
								}}
								name="dia_diem_code"
								value={maDiaDiemThi}
							>
								<SelectTrigger>
									<SelectValue placeholder="Chọn địa điểm thi" />
								</SelectTrigger>
								<SelectContent>
									{listDiaDiemThi.map((item) => (
										<SelectItem key={item.code} value={item.code}>
											{item.code} - {item.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						<Field>
							<FieldLabel>Chọn cấp độ thi</FieldLabel>
							<Select
								disabled={!maDiaDiemThi && mode === "add"}
								name="ma_cap_thi"
								onValueChange={(value: string) => {
									if (value && value?.trim()) {
										const split = value.split(" ");
										if (split.length === 3) {
											const ma = split[0];
											const ngay = split[1];
											const gio = split[2];

											const ngay_gio = ngay + " " + gio;

											const exist = listKyThi.find(
												(item) =>
													item.ma_cap_thi === ma &&
													item.ngay_mo_dang_ky === ngay_gio,
											);

											setExamSelected(exist);
										}
									}
								}}
								value={handleGetCapDoThi()}
							>
								<SelectTrigger>
									<SelectValue placeholder="Chọn cấp độ thi" />
								</SelectTrigger>
								<SelectContent>
									{listKyThi.map((item, idx) => (
										<SelectItem
											key={idx}
											value={item.ma_cap_thi + " " + item.ngay_mo_dang_ky}
										>
											{item.ma_cap_thi} - {item.ten_cap_thi}{" "}
											{item.ngay_mo_dang_ky}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
					</FieldGroup>{" "}
					<DialogFooter>
						<Button onClick={() => onOpenChange(false)}> Hủy</Button>
						<Button type="submit">Lưu</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
