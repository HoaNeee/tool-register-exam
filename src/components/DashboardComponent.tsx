import {
	type ConfigExamTarget,
	type ICoSoLienKet,
	type IDiaDiem,
	type IProxy,
} from "@/types/types";
import { useEffect, useState } from "react";
import { DialogAddOrEditExam } from "./dialogs/DialogAddOrEditExam";
import { examRemoteService } from "@/services/exam-remote-service";
import { configExamService } from "@/services/config-exam-service";
import { handleExceptionGlobal } from "@/utils/exception";
import DialogConfirmDelete from "./dialogs/DialogConfirmDelete";
import { DOMAIN } from "@/utils/api-request";
import { Gauge } from "lucide-react";
import { Button } from "./ui/button";
import { schedulerService } from "@/services/scheduler-service";
import {
	KEY_MESSAGE_FROM_BACKGROUND,
	KEY_REQUEST_TO_BACKGROUND,
} from "@/constants/constants";
import { getConfigTest, ID_TEST } from "@/constants/default-value";
import { logError } from "@/utils/utils";
import { Field, FieldLabel } from "./ui/field";
import { Checkbox } from "./ui/checkbox";
import { storageService } from "@/services/storage-service";
import DialogAddOrEditProxy from "./dialogs/DialogAddOrEditProxy";
import DialgoShowIp from "./dialogs/DialogShowIp";

export default function DashboardComponent() {
	const [exams, setExams] = useState<ConfigExamTarget[]>([]);
	const [listDiaDiemThi, setListDiaDiemThi] = useState<IDiaDiem[]>([]);
	const [listCoSoLienKet, setListCoSoLienKet] = useState<ICoSoLienKet[]>([]);
	const [isAutoGlobal, setIsAutoGlobal] = useState(false);
	const [examEdit, setExamEdit] = useState<ConfigExamTarget | null>(null);

	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showModalProxy, setShowModalProxy] = useState(false);
	const [proxy, setProxy] = useState<IProxy | null>(null);
	const [isUseProxy, setIsUseProxy] = useState(false);

	const [isAutoLoop, setIsAutoLoop] = useState(false);

	const [openDialogShowIp, setOpenDialogShowIp] = useState(false);

	const [myIp, setMyIp] = useState("");

	const [isDeveloperMode, setIsDeveloperMode] = useState(false);

	useEffect(() => {
		function addStorageChange() {
			async function handleRegister() {
				try {
					const listConfig = await configExamService.getListConfigExam();

					const promise = [];
					const updateStatusPromise = [];
					const ids = [];

					for (const config of listConfig) {
						if (
							schedulerService.getIsInTime(config.exam_register.ngay_mo_dang_ky)
						) {
							if (ids.includes(config.id)) continue;
							ids.push(config.id);
							updateStatusPromise.push(
								configExamService.updateStatusConfigExam(
									config.id,
									"registering",
								),
							);
							promise.push(configExamService.registerExam(config));
						}
					}

					await Promise.all(updateStatusPromise);
					setExams((prev) => {
						return prev.map((item) => {
							if (ids.includes(item.id)) {
								return { ...item, status: "registering" };
							}
							return item;
						});
					});

					await Promise.all(promise);
				} catch (error) {
					handleExceptionGlobal(error);
				}
			}
			const keys = [
				KEY_MESSAGE_FROM_BACKGROUND.EXECUTE_REGISTER_EXAM,
				KEY_MESSAGE_FROM_BACKGROUND.UPDATE_STATUS_CONFIG_EXAM,
			];

			chrome.storage.onChanged.addListener(
				(changes: unknown, namespace: string) => {
					if (namespace === "local") {
						for (const key of keys) {
							if (changes[key]) {
								const newValue = changes[key]?.newValue;
								if (key === KEY_MESSAGE_FROM_BACKGROUND.EXECUTE_REGISTER_EXAM) {
									handleRegister();
								}
								if (
									key === KEY_MESSAGE_FROM_BACKGROUND.UPDATE_STATUS_CONFIG_EXAM
								) {
									const id = newValue.id;
									const status = newValue.status;
									configExamService.updateStatusConfigExam(id, status);
									setExams((prev) => {
										return prev.map((item) => {
											if (item.id === id) {
												return { ...item, status };
											}
											return item;
										});
									});
								}
							}
						}
					}
				},
			);
		}

		async function addShortCutListener() {
			if (typeof document !== "undefined") {
				document.addEventListener("keydown", async (e) => {
					if ((e.key === "d" || e.key === "D") && e.ctrlKey && e.shiftKey) {
						e.preventDefault();
						const developerMode = await storageService.getIsDeveloperMode();
						await storageService.setIsDeveloperMode(!developerMode);
						setIsDeveloperMode(!developerMode);
					}
				});
			}
		}

		const fn = async () => {
			try {
				const diaDiems = await examRemoteService.getDiaDiemThi();
				setListDiaDiemThi(diaDiems);

				const coSos = await examRemoteService.getCoSoLienKet();
				setListCoSoLienKet(coSos);

				const listConfigExam = await configExamService.getListConfigExam(true);
				setExams(listConfigExam);

				const isAutoAll = await storageService.getIsAutoRegisterAll();
				setIsAutoGlobal(isAutoAll);

				await schedulerService.clearAndCreateSchedulerAlarm();

				const proxySaved = await storageService.getProxySaved();
				setProxy(proxySaved);

				const isUseProxySaved = await storageService.getIsUseProxy();
				setIsUseProxy(isUseProxySaved);

				if (isUseProxySaved && proxySaved) {
					await chrome.runtime.sendMessage({
						type: KEY_REQUEST_TO_BACKGROUND.APPLY_PROXY,
						proxy: proxySaved,
					});
				} else {
					await chrome.runtime.sendMessage({
						type: KEY_REQUEST_TO_BACKGROUND.CLEAR_PROXY,
					});
				}

				const isDeveloperMode = await storageService.getIsDeveloperMode();
				setIsDeveloperMode(isDeveloperMode);

				const isAutoLoopSaved = await storageService.getIsAutoLoop();
				setIsAutoLoop(isAutoLoopSaved);
			} catch (error) {
				handleExceptionGlobal(error);
			}
		};
		fn();
		addStorageChange();
		addShortCutListener();
	}, []);

	const handleDeleteExam = async (id: string) => {
		try {
			const success = await configExamService.removeConfigExam(id);
			if (success) {
				setExams((prev) => {
					return prev.filter((item) => item.id !== id);
				});
			}
		} catch (error) {
			handleExceptionGlobal(error);
		}
	};

	const handleToggleAuto = async (id: string, isAuto: boolean) => {
		try {
			const success = await configExamService.updateAutoRegister(id, isAuto);
			if (success) {
				setExams((prev) => {
					return prev.map((item) => {
						if (item.id === id) {
							return { ...item, is_auto_register: isAuto };
						}
						return item;
					});
				});
				await schedulerService.clearAndCreateSchedulerAlarm();
			}
		} catch (error) {
			handleExceptionGlobal(error);
		}
	};

	const handleStatusConfigExam = (status: ConfigExamTarget["status"]) => {
		if (status === "registered") {
			return (
				<span className="px-2 py-0.5 text-xs rounded bg-green-50 text-green-700 border border-green-200">
					Đã đăng ký
				</span>
			);
		}

		if (status === "failed") {
			return (
				<span className="px-2 py-0.5 text-xs rounded bg-red-50 text-red-700 border border-red-200">
					Thất Bại
				</span>
			);
		}

		if (status === "error") {
			return (
				<span className="px-2 py-0.5 text-xs rounded bg-red-50 text-red-700 border border-red-200">
					Lỗi
				</span>
			);
		}

		if (status === "waiting") {
			return (
				<span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 border border-gray-200">
					Đang chờ
				</span>
			);
		}

		if (status === "registering") {
			return (
				<span className="px-2 py-0.5 text-xs rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
					Đang đăng ký
				</span>
			);
		}

		return (
			<span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 border border-gray-200">
				{status}
			</span>
		);
	};

	const handleGetAvatarUrl = (url: string) => {
		return DOMAIN + "/v1/public" + url;
	};

	async function handleAddValueTest() {
		try {
			const list = await configExamService.getListConfigExam();
			const newList = list.filter((item) => !item.id.includes(ID_TEST));

			newList.push(
				getConfigTest(0) as ConfigExamTarget,
				getConfigTest(1) as ConfigExamTarget,
			);
			await configExamService.saveListConfigExam(newList);
			setExams(newList);
		} catch (error) {
			logError("handleAddValueTest", error);
		}
	}

	async function handleForceRegisterManual(exam: ConfigExamTarget) {
		try {
			setExams((prev) => {
				return prev.map((i) => {
					if (i.id === exam.id) {
						return { ...i, status: "registering" };
					}
					return i;
				});
			});
			const success = await examRemoteService.registerExam({
				ma_cap_thi: exam.exam_register.ma_cap_thi,
				auth: exam.auth,
				ngay_mo_dang_ky: exam.exam_register.ngay_mo_dang_ky,
				answers: [],
			});

			if (success) {
				setExams((prev) => {
					return prev.map((i) => {
						if (i.id === exam.id) {
							return { ...i, status: "registered" };
						}
						return i;
					});
				});
			} else {
				setExams((prev) => {
					return prev.map((i) => {
						if (i.id === exam.id) {
							return { ...i, status: "failed" };
						}
						return i;
					});
				});
			}
		} catch (error) {
			setExams((prev) => {
				return prev.map((i) => {
					if (i.id === exam.id) {
						return { ...i, status: "failed" };
					}
					return i;
				});
			});
			handleExceptionGlobal(error);
		}
	}

	async function handleClearAllConfig() {
		try {
			await configExamService.saveListConfigExam([]);
			setExams([]);
		} catch (error) {
			handleExceptionGlobal(error);
		}
	}

	return (
		<div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-3">
				<div className="max-w-6xl mx-auto flex items-center justify-between">
					<div>
						<h1 className="text-lg font-bold text-gray-900">
							Exam Assistant Dashboard
						</h1>
						<p className="text-xs text-gray-500">
							Công cụ hỗ trợ đăng ký kì thi tự động
						</p>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-5">
				{/* Action bar */}
				<div className="bg-white p-3 border border-gray-200 rounded-lg">
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ">
						<Button onClick={() => setShowAddModal(true)} size={"sm"}>
							+ Thêm cấu hình đăng ký
						</Button>
						{isDeveloperMode && (
							<Button onClick={handleAddValueTest} size={"sm"}>
								+ Thêm test
							</Button>
						)}
						<Button onClick={() => setShowModalProxy(true)} size={"sm"}>
							{proxy ? "Thay đổi Proxy" : "Thêm Proxy"}
						</Button>
						<Button
							onClick={async () => {
								const ip = await chrome.runtime.sendMessage({
									type: KEY_REQUEST_TO_BACKGROUND.CHECK_IP,
								});
								setMyIp(ip);
								setOpenDialogShowIp(true);
							}}
							size={"sm"}
						>
							Kiểm tra IP
						</Button>
						{isDeveloperMode && (
							<Button
								onClick={async () => {
									console.log(await chrome.alarms.getAll());
								}}
								size={"sm"}
							>
								Click
							</Button>
						)}

						<DialogConfirmDelete
							type="trigger"
							trigger={<Button size={"sm"}>Xoá tất cả cấu hình</Button>}
							onConfirm={handleClearAllConfig}
						/>
					</div>
				</div>
				<div className="bg-white p-3 border border-gray-200 rounded-lg flex flex-col gap-2">
					<Field orientation="horizontal">
						<Checkbox
							id="auto-register-all"
							checked={isAutoGlobal}
							onCheckedChange={async () => {
								try {
									const status = !isAutoGlobal;
									setIsAutoGlobal(status);
									await storageService.setIsAutoRegisterAll(status);
									await schedulerService.clearAndCreateSchedulerAlarm();
								} catch (error) {
									handleExceptionGlobal(error);
								}
							}}
						/>
						<FieldLabel htmlFor="auto-register-all">Tự Động Tất Cả</FieldLabel>
					</Field>
					<Field orientation="horizontal">
						<Checkbox
							disabled={!proxy}
							id="use-proxy"
							checked={isUseProxy}
							onCheckedChange={async () => {
								try {
									const status = !isUseProxy;
									setIsUseProxy(status);
									await storageService.setIsUseProxy(status);
									if (status) {
										await chrome.runtime.sendMessage({
											type: KEY_REQUEST_TO_BACKGROUND.APPLY_PROXY,
											proxy: proxy,
										});
									} else {
										await chrome.runtime.sendMessage({
											type: KEY_REQUEST_TO_BACKGROUND.CLEAR_PROXY,
										});
									}
								} catch (error) {
									handleExceptionGlobal(error);
								}
							}}
						/>
						<FieldLabel htmlFor="use-proxy">Sử Dụng Proxy</FieldLabel>
					</Field>

					<Field orientation="horizontal">
						<Checkbox
							id="auto-loop"
							checked={isAutoLoop}
							onCheckedChange={async () => {
								try {
									const status = !isAutoLoop;
									setIsAutoLoop(status);
									await storageService.setIsAutoLoop(status);
								} catch (error) {
									handleExceptionGlobal(error);
								}
							}}
						/>
						<FieldLabel htmlFor="auto-loop">
							Lặp lại yêu cầu đăng ký liên tục
						</FieldLabel>
					</Field>
				</div>

				{/* Table */}
				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
					<table className="w-full text-left border-collapse text-sm">
						<thead>
							<tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
								<th className="px-4 py-3">Ảnh</th>
								<th className="px-4 py-3">Họ tên</th>
								<th className="px-4 py-3">Mã môn</th>
								<th className="px-4 py-3">Tên môn</th>
								<th className="px-4 py-3">Thời gian / Phòng</th>
								<th className="px-4 py-3">
									<div className="flex items-center gap-2">
										<span>Trạng thái</span>
										<span>
											<Gauge
												size={14}
												onClick={async () => {
													const newList =
														await configExamService.getListConfigExam(true);
													setExams(newList);
												}}
												className="cursor-pointer"
											/>
										</span>
									</div>
								</th>
								<th className="px-4 py-3">Tự động</th>
								<th className="px-4 py-3 text-right">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{exams.length === 0 ? (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-8 text-center text-gray-400 text-xs w-full"
									>
										Chưa có cấu hình đăng ký nào.
									</td>
								</tr>
							) : (
								exams.map((exam) => (
									<tr key={exam.id} className="hover:bg-gray-50 transition">
										<td className="px-4 py-3">
											<img
												src={handleGetAvatarUrl(
													exam.thong_tin_ca_nhan.cccd.anh_the,
												)}
												alt={exam.thong_tin_ca_nhan.cccd.ho_ten}
												className="w-10 h-10 rounded-xs object-cover"
											/>
										</td>
										<td className="px-4 py-3 font-medium text-blue-700">
											{exam.thong_tin_ca_nhan.cccd.ho_ten}
										</td>
										<td className="px-4 py-3 font-medium text-blue-700">
											{exam.exam_register.ma_cap_thi}
										</td>
										<td className="px-4 py-3 text-gray-800">
											{exam.exam_register.ten_cap_thi}
										</td>
										<td className="px-4 py-3 text-xs text-gray-600">
											<div>{exam.exam_register.ngay_mo_dang_ky}</div>
										</td>
										<td className="px-4 py-3">
											{handleStatusConfigExam(exam.status)}
										</td>
										<td className="px-4 py-3">
											<button
												onClick={() =>
													handleToggleAuto(exam.id, !exam.is_auto_register)
												}
												className={`text-xs px-2 py-0.5 rounded cursor-pointer font-medium ${
													exam.is_auto_register
														? "bg-blue-100 text-blue-800 border border-blue-200"
														: "bg-gray-100 text-gray-500 border border-gray-200"
												}`}
											>
												{exam.is_auto_register ? "Bật" : "Tắt"}
											</button>
										</td>
										<td className="px-4 py-3">
											<div className="text-right flex gap-2 items-center justify-end">
												{exam.status !== "registered" &&
													exam.status !== "registering" && (
														<button
															onClick={() => {
																handleForceRegisterManual(exam);
															}}
															className="text-xs text-yellow-600 hover:underline cursor-pointer"
														>
															Thủ công
														</button>
													)}
												<button
													onClick={() => {
														setExamEdit(exam);
														setShowEditModal(true);
													}}
													className="text-xs text-blue-600 hover:underline cursor-pointer"
												>
													Chỉnh sửa
												</button>
												<DialogConfirmDelete
													trigger={
														<button
															onClick={() => {}}
															className="text-xs text-red-600 hover:underline cursor-pointer"
														>
															Xóa
														</button>
													}
													type="trigger"
													onConfirm={async () => {
														await handleDeleteExam(exam.id);
													}}
												/>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</main>

			{/* Simple Modal */}
			{showAddModal && (
				<DialogAddOrEditExam
					open={showAddModal}
					onOpenChange={setShowAddModal}
					mode="add"
					listDiaDiemThi={listDiaDiemThi}
					onSubmit={async (data) => {
						try {
							const res = await configExamService.addNewConfigExamService(data);
							setExams((prev) => [...prev, res]);
							setShowAddModal(false);
							await schedulerService.clearAndCreateSchedulerAlarm();
						} catch (error) {
							handleExceptionGlobal(error);
						}
					}}
				/>
			)}
			{showEditModal && (
				<DialogAddOrEditExam
					open={showEditModal}
					onOpenChange={setShowEditModal}
					mode="edit"
					listDiaDiemThi={listDiaDiemThi}
					configExam={examEdit}
					onSubmit={async (data) => {
						try {
							const success = await configExamService.updateConfigExam(
								data.id,
								data,
							);
							if (success) {
								setExams((prev) => {
									return prev.map((item) => {
										if (item.id === data.id) {
											return data;
										}
										return item;
									});
								});
							}
							setShowEditModal(false);
							await schedulerService.clearAndCreateSchedulerAlarm();
						} catch (error) {
							handleExceptionGlobal(error);
						}
					}}
				/>
			)}
			{showModalProxy && (
				<DialogAddOrEditProxy
					open={showModalProxy}
					setOpen={setShowModalProxy}
					initialProxy={proxy}
					onSubmit={async (newProxy) => {
						try {
							await storageService.saveProxySaved(newProxy);
							setProxy(newProxy);
						} catch (error) {
							handleExceptionGlobal(error);
						}
					}}
				/>
			)}
			{openDialogShowIp && (
				<DialgoShowIp
					open={openDialogShowIp}
					setOpen={setOpenDialogShowIp}
					myIp={myIp}
				/>
			)}
		</div>
	);
}
