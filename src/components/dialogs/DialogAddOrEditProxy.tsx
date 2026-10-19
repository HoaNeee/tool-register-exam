import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import type { IProxy } from "@/types/types";
import { Field, FieldLabel } from "../ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { KEY_REQUEST_TO_BACKGROUND } from "@/constants/constants";
import { storageService } from "@/services/storage-service";

interface Props {
	open: boolean;
	setOpen: (_open: boolean) => void;
	onSubmit?: (_proxy: IProxy) => void;
	initialProxy?: IProxy | null;
}

export default function DialogAddOrEditProxy({
	open,
	setOpen,
	onSubmit,
	initialProxy,
}: Props) {
	const [ip, setIp] = useState<string>("");
	const [port, setPort] = useState<string>("");
	const [username, setUsername] = useState<string>("");
	const [password, setPassword] = useState<string>("");

	const [proxyStr, setProxyStr] = useState<string>("");
	const [scheme, setScheme] = useState<IProxy["scheme"]>("http");

	const [messageCheck, setMessageCheck] = useState<string>("");
	const [checkStatus, setCheckStatus] = useState<"idle" | "success" | "error">(
		"idle",
	);
	const [isChecking, setIsChecking] = useState<boolean>(false);

	useEffect(() => {
		const fn = () => {
			if (initialProxy) {
				setIp(initialProxy.ip || "");
				setPort(initialProxy.port || "");
				setUsername(initialProxy.username || "");
				setPassword(initialProxy.password || "");
				setScheme(initialProxy.scheme || "http");
				setProxyStr(initialProxy.proxy_string || "");
			}
		};
		fn();
	}, [initialProxy]);

	const handleSaveProxy = () => {
		const payload: IProxy = {
			ip: ip.trim(),
			port: port.trim(),
			username: username.trim(),
			password: password.trim(),
			scheme,
			proxy_string: proxyStr,
		};

		onSubmit?.(payload);
		setOpen(false);
	};

	function handleChangeProxyString(proxy_string: string) {
		setProxyStr(proxy_string);
		if (!proxy_string || typeof proxy_string !== "string") return;

		let cleaned = proxy_string.trim();

		// Nhận diện scheme
		if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
			cleaned = cleaned.replace(/^https?:\/\//, "");
			setScheme("http");
		} else if (cleaned.startsWith("socks5://")) {
			cleaned = cleaned.replace(/^socks5:\/\//, "");
			setScheme("socks5");
		}

		// Định dạng user:pass@ip:port
		if (cleaned.includes("@")) {
			const [authPart, hostPart] = cleaned.split("@");
			if (authPart && hostPart) {
				const [u, p] = authPart.split(":");
				const [h, pt] = hostPart.split(":");
				if (h) setIp(h);
				if (pt) setPort(pt);
				if (u) setUsername(u);
				if (p) setPassword(p);
				return;
			}
		}

		// Định dạng IP:PORT:USER:PASS hoặc IP:PORT
		if (cleaned.includes(":")) {
			const arr = cleaned.split(":");
			if (arr.length === 2) {
				setIp(arr[0]);
				setPort(arr[1]);
			} else if (arr.length === 4) {
				setIp(arr[0]);
				setPort(arr[1]);
				setUsername(arr[2]);
				setPassword(arr[3]);
			}
		}
	}

	async function checkProxyLive(proxyData: IProxy) {
		const cleanIp = proxyData.ip?.trim();
		const cleanPort = proxyData.port?.trim();

		if (!cleanIp || !cleanPort) {
			setMessageCheck("Vui lòng nhập IP và Port trước khi kiểm tra!");
			setCheckStatus("error");
			return;
		}

		if (proxyData.scheme === "socks5" && proxyData.username) {
			setMessageCheck(
				"⚠️ Chrome không hỗ trợ xác thực (Username/Password) cho proxy SOCKS5! Vui lòng chuyển Type sang HTTP/HTTPS.",
			);
			setCheckStatus("error");
			return;
		}

		const current_proxy = await storageService.getProxySaved();

		await storageService.saveProxySaved({
			ip: cleanIp,
			port: cleanPort,
			username: proxyData.username,
			password: proxyData.password,
			scheme: proxyData.scheme,
			proxy_string: proxyStr,
		});

		setIsChecking(true);
		setMessageCheck("Đang kết nối và kiểm tra kết nối qua proxy...");
		setCheckStatus("idle");

		try {
			const res = await new Promise<{
				success: boolean;
				ip?: string;
				error?: string;
			}>((resolve) => {
				chrome.runtime.sendMessage(
					{
						type: KEY_REQUEST_TO_BACKGROUND.CHECK_PROXY,
						proxy: {
							ip: cleanIp,
							port: cleanPort,
							username: proxyData.username?.trim(),
							password: proxyData.password?.trim(),
							scheme: proxyData.scheme,
						},
					},
					(
						response:
							| { success: boolean; ip?: string; error?: string }
							| undefined,
					) => {
						if (chrome.runtime.lastError) {
							resolve({
								success: false,
								error:
									chrome.runtime.lastError.message ||
									"Không thể kết nối với background script. Vui lòng tải lại trang Dashboard.",
							});
						} else {
							resolve(
								response || {
									success: false,
									error:
										"Không nhận được phản hồi từ background service worker",
								},
							);
						}
					},
				);
			});

			if (res.success) {
				setMessageCheck(`✅ PROXY LIVE! Địa chỉ IP nhận diện: ${res.ip}`);
				setCheckStatus("success");
			} else {
				setMessageCheck(`❌ PROXY DEAD: ${res.error}`);
				setCheckStatus("error");
			}
		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			setMessageCheck(`❌ Lỗi kiểm tra: ${msg}`);
			setCheckStatus("error");
		} finally {
			setIsChecking(false);
			await storageService.saveProxySaved(current_proxy || null);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogTitle>Thêm / Cập nhật Proxy</DialogTitle>
				<DialogDescription>
					Cấu hình proxy để extension thực hiện các tác vụ và gửi request
				</DialogDescription>

				<Field>
					<FieldLabel>Dán chuỗi Proxy (IP:Port:User:Pass)</FieldLabel>
					<Input
						value={proxyStr}
						onChange={(e) => {
							handleChangeProxyString(e.target.value);
						}}
						placeholder="Ví dụ: 103.152.112.12:8080:user:pass"
					/>
				</Field>

				<div className="flex flex-col gap-4">
					<Field>
						<FieldLabel htmlFor="ip">Địa chỉ IP</FieldLabel>
						<Input
							id="ip"
							value={ip}
							onChange={(e) => setIp(e.target.value)}
							placeholder="e.g., 103.152.112.12"
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor="port">Port</FieldLabel>
						<Input
							id="port"
							type="number"
							value={port}
							onChange={(e) => setPort(e.target.value)}
							placeholder="e.g., 8080"
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor="username">Username</FieldLabel>
						<Input
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Không bắt buộc"
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor="password">Password</FieldLabel>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Không bắt buộc"
						/>
					</Field>

					<Field>
						<FieldLabel>Giao thức (Type)</FieldLabel>
						<Select
							value={scheme}
							onValueChange={(val) => {
								if (val) setScheme(val as IProxy["scheme"]);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Chọn loại proxy" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="http">HTTP / HTTPS</SelectItem>
								<SelectItem value="socks5">SOCKS5</SelectItem>
							</SelectContent>
						</Select>
					</Field>

					{scheme === "socks5" && (username || password) && (
						<div className="p-2.5 rounded-md bg-amber-50 text-amber-800 text-xs border border-amber-200">
							⚠️ <strong>Lưu ý:</strong> Trình duyệt Chrome không hỗ trợ xác
							thực mật khẩu cho giao thức SOCKS5. Nếu proxy của bạn có
							Username/Password, hãy đổi Giao thức sang{" "}
							<strong>HTTP/HTTPS</strong>.
						</div>
					)}

					{messageCheck && (
						<div
							className={`p-3 rounded-md text-xs font-medium border leading-relaxed ${
								checkStatus === "success"
									? "bg-emerald-50 text-emerald-800 border-emerald-200"
									: checkStatus === "error"
										? "bg-rose-50 text-rose-800 border-rose-200"
										: "bg-blue-50 text-blue-800 border-blue-200"
							}`}
						>
							{messageCheck}
						</div>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<Button variant="outline" onClick={() => setOpen(false)}>
							Huỷ
						</Button>
						<Button
							variant="outline"
							disabled={isChecking}
							onClick={async () => {
								checkProxyLive({
									ip,
									port,
									username,
									password,
									scheme,
									proxy_string: proxyStr,
								});
							}}
						>
							{isChecking ? "Đang kiểm tra..." : "Kiểm tra"}
						</Button>
						<Button onClick={handleSaveProxy}>Lưu</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
