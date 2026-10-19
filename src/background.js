import {
	KEY_ALARM_NAME,
	KEY_IS_USE_PROXY,
	KEY_MESSAGE_FROM_BACKGROUND,
	KEY_PROXY,
	KEY_REQUEST_TO_BACKGROUND,
	KEY_TAB,
} from "./constants/constants";
import { schedulerService } from "./services/scheduler-service";
import { storageService } from "./services/storage-service";
import {
	DB_deleteValue,
	DB_getValue,
	DB_setValue,
	sendMessageFromBackground,
} from "./utils/storage";
import {
	checkIsDashboardTab,
	logActions,
	logError,
	sleep,
} from "./utils/utils";

// Lưu thông tin xác thực proxy hiện tại trong bộ nhớ Service Worker
let activeProxyAuth = null;

// Lắng nghe xác thực proxy ở cấp cao nhất (bắt buộc trong Manifest V3)
chrome.webRequest.onAuthRequired.addListener(
	(details, callback) => {
		if (details.isProxy) {
			if (activeProxyAuth && activeProxyAuth.username) {
				callback({
					authCredentials: {
						username: activeProxyAuth.username,
						password: activeProxyAuth.password || "",
					},
				});
				return;
			}

			// Dự phòng: Nếu Service Worker vừa khởi động lại, lấy từ chrome.storage
			chrome.storage.local.get(KEY_PROXY).then((proxy) => {
				if (proxy && proxy.username) {
					activeProxyAuth = {
						username: proxy.username,
						password: proxy.password || "",
					};
					callback({
						authCredentials: {
							username: proxy.username,
							password: proxy.password || "",
						},
					});
				} else {
					callback({});
				}
			});

			return;
		}
		callback({});
	},
	{ urls: ["<all_urls>"] },
	["asyncBlocking"],
);

// Áp dụng cài đặt Proxy cho toàn bộ trình duyệt
async function applyProxySettings(proxy) {
	if (!proxy || !proxy.ip || !proxy.port) {
		activeProxyAuth = null;
		await new Promise((resolve) =>
			chrome.proxy.settings.clear({ scope: "regular" }, resolve),
		);
		console.log("[Background] Cleared proxy settings");
		return;
	}

	activeProxyAuth = {
		username: proxy.username || "",
		password: proxy.password || "",
	};

	const config = {
		mode: "fixed_servers",
		rules: {
			singleProxy: {
				scheme: proxy.scheme || "http",
				host: String(proxy.ip).trim(),
				port: parseInt(String(proxy.port).trim(), 10),
			},
			bypassList: ["<local>"],
		},
	};

	await new Promise((resolve) =>
		chrome.proxy.settings.set({ value: config, scope: "regular" }, resolve),
	);
	console.log("[Background] Applied proxy settings:", config);
}

async function clearProxySettings() {
	await new Promise((resolve) =>
		chrome.proxy.settings.clear({ scope: "regular" }, resolve),
	);
	console.log("[Background] Cleared proxy settings");
}

// Hàm kiểm tra proxy kết nối còn sống (LIVE) hay không
async function handleCheckProxy(proxy) {
	const ip = proxy?.ip?.trim();
	const port = parseInt(proxy?.port, 10);
	const scheme = proxy?.scheme || "http";
	const username = proxy?.username?.trim() || "";
	const password = proxy?.password || "";

	if (!ip || !port || isNaN(port)) {
		return { success: false, error: "IP hoặc Port không hợp lệ!" };
	}

	// Cảnh báo hạn chế của Chromium đối với SOCKS5 có Auth
	if (scheme === "socks5" && username) {
		return {
			success: false,
			error:
				"Chrome không hỗ trợ xác thực (Username/Password) cho proxy SOCKS5! Vui lòng chuyển Type sang HTTP/HTTPS hoặc dùng SOCKS5 không có mật khẩu (IP whitelist).",
		};
	}

	// 1. Lưu cấu hình proxy hiện tại để khôi phục sau khi test
	let oldSettings = null;
	try {
		oldSettings = await new Promise((resolve) => {
			chrome.proxy.settings.get({ incognito: false }, resolve);
		});
	} catch (e) {
		console.warn("[Background] Could not get old proxy settings:", e);
	}
	const previousAuth = activeProxyAuth;

	// 2. Lắng nghe chi tiết lỗi mạng từ Chromium Proxy stack
	let proxyErrorCode = "";
	const onProxyErrorListener = (details) => {
		console.warn("[Background] Proxy error details:", details);
		proxyErrorCode = details.error;
	};
	if (chrome.proxy?.onProxyError) {
		chrome.proxy.onProxyError.addListener(onProxyErrorListener);
	}

	try {
		// 3. Tạm thời set auth credentials và cấu hình proxy
		activeProxyAuth = { username, password };

		const tempConfig = {
			mode: "fixed_servers",
			rules: {
				singleProxy: {
					scheme,
					host: ip,
					port,
				},
				bypassList: ["<local>"],
			},
		};

		await new Promise((resolve) =>
			chrome.proxy.settings.set(
				{ value: tempConfig, scope: "regular" },
				resolve,
			),
		);

		// Đợi 250ms để Chrome Socket Pool đồng bộ cấu hình proxy
		await sleep(250);

		// 4. Test fetch qua proxy
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 7000);

		let detectedIp = "";
		try {
			// Thử endpoint 1: https://api.ipify.org?format=json
			const res = await fetch(
				`https://api.ipify.org?format=json&t=${Date.now()}`,
				{
					signal: controller.signal,
					cache: "no-store",
				},
			);
			if (res.ok) {
				const data = await res.json();
				detectedIp = data.ip;
			} else {
				throw new Error(`HTTP ${res.status}`);
			}
		} catch (errHttps) {
			// Nếu HTTPS fail (nhiều proxy không hỗ trợ tunnel CONNECT 443), thử HTTP thường
			try {
				const resHttp = await fetch(
					`http://api.ipify.org?format=json&t=${Date.now()}`,
					{
						signal: controller.signal,
						cache: "no-store",
					},
				);
				if (resHttp.ok) {
					const dataHttp = await resHttp.json();
					detectedIp = dataHttp.ip;
				} else {
					throw errHttps;
				}
			} catch {
				throw errHttps;
			}
		} finally {
			clearTimeout(timeoutId);
		}

		return {
			success: true,
			ip: detectedIp,
		};
	} catch (error) {
		console.log("[Background] Proxy check failed:", error);
		let errMessage = error?.message || "Lỗi không xác định";

		if (proxyErrorCode) {
			if (proxyErrorCode === "net::ERR_PROXY_CONNECTION_FAILED") {
				errMessage =
					"Không thể kết nối tới máy chủ Proxy (IP/Port không đúng hoặc proxy đã chết).";
			} else if (
				proxyErrorCode === "net::ERR_PROXY_AUTH_UNSUPPORTED" ||
				proxyErrorCode === "net::ERR_PROXY_AUTH_FAILED"
			) {
				errMessage = "Xác thực Proxy thất bại (Sai Username hoặc Password).";
			} else if (proxyErrorCode === "net::ERR_SOCKS_CONNECTION_FAILED") {
				errMessage =
					"Lỗi kết nối SOCKS (Chrome không hỗ trợ auth cho SOCKS5 hoặc proxy không phản hồi).";
			} else if (proxyErrorCode === "net::ERR_TUNNEL_CONNECTION_FAILED") {
				errMessage =
					"Proxy từ chối kết nối tunnel (có thể sai auth hoặc proxy không hỗ trợ HTTPS).";
			} else {
				errMessage = `Lỗi mạng: ${proxyErrorCode}`;
			}
		} else if (error?.name === "AbortError") {
			errMessage =
				"Hết thời gian chờ (Timeout sau 7s - Proxy phản hồi quá chậm hoặc chết).";
		}

		return {
			success: false,
			error: errMessage,
		};
	} finally {
		if (chrome.proxy?.onProxyError) {
			chrome.proxy.onProxyError.removeListener(onProxyErrorListener);
		}

		// Khôi phục proxy trước khi test
		try {
			if (oldSettings?.value?.mode && oldSettings.value.mode !== "system") {
				await new Promise((resolve) =>
					chrome.proxy.settings.set(oldSettings, resolve),
				);
				activeProxyAuth = previousAuth;
			} else {
				await new Promise((resolve) =>
					chrome.proxy.settings.clear({ scope: "regular" }, resolve),
				);
				activeProxyAuth = null;
			}
		} catch (restoreErr) {
			console.error("[Background] Error restoring proxy settings:", restoreErr);
		}
	}
}

// Khởi tạo proxy đã lưu khi Service Worker khởi động
async function initSavedProxy() {
	try {
		const isUseProxy = await storageService.getIsUseProxy();
		const proxy = await storageService.getProxySaved();

		if (isUseProxy && proxy?.ip && proxy?.port) {
			console.log("[Background] Proxy settings found, applying...");
			await applyProxySettings(proxy);
		} else {
			console.log("[Background] No proxy settings found, clearing...");
			clearProxySettings();
		}
	} catch (e) {
		console.error("[Background] Error initializing proxy:", e);
	}
}

initSavedProxy();

async function handleCheckIP(sendResponse) {
	try {
		const res = await fetch("https://api.ipify.org");
		const ip = await res.text();

		sendResponse(ip);
	} catch (error) {
		logError("[Background] Error when handleCheckIP: ", error);
		sendResponse({ error: error.message });
	}
}

// Lắng nghe messages từ các tab / extension pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message?.type === KEY_REQUEST_TO_BACKGROUND.CHECK_PROXY) {
		handleCheckProxy(message.proxy).then((res) => sendResponse(res));
		return true; // Giữ channel mở cho phản hồi async
	}

	if (message?.type === KEY_REQUEST_TO_BACKGROUND.APPLY_PROXY) {
		applyProxySettings(message.proxy).then(() => {
			sendResponse({ success: true });
		});
		return true;
	}

	if (message?.type === KEY_REQUEST_TO_BACKGROUND.CLEAR_PROXY) {
		applyProxySettings(null).then(() => {
			sendResponse({ success: true });
		});
		return true;
	}

	if (message?.type === KEY_REQUEST_TO_BACKGROUND.CHECK_IP) {
		handleCheckIP(sendResponse);
		return true;
	}
});

chrome.action.onClicked.addListener(() => {
	chrome.tabs.create({
		url: "index.html",
	});
});

chrome.alarms.onAlarm.addListener((alarm) => {
	handleOnAlarm(alarm);
});

chrome.tabs.onRemoved.addListener((tabId) => {
	handleOnRemove(tabId);
});

chrome.webNavigation.onCommitted.addListener((details) => {
	handleOnCommited(details);
});

async function handleOnAlarm(alarm) {
	try {
		logActions(alarm);

		if (alarm.name === "TEST_ALARM") {
			logActions("[Background] Alarm test fired:", new Date().toISOString());
			// schedulerService.createSchedulerAlarm();
		}

		if (alarm.name === KEY_ALARM_NAME) {
			logActions("[Background] Alarm fired:", new Date().toISOString());
			await sendMessageFromBackground(
				KEY_MESSAGE_FROM_BACKGROUND.EXECUTE_REGISTER_EXAM,
				Date.now(),
			);
			await schedulerService.createSchedulerAlarm();
		}
	} catch (error) {
		logError("[Background] Error when handleOnAlarm: ", error);
	}
}

async function handleOnCommited(details) {
	try {
		if (details.frameId === 0) {
			const currentId = details.tabId;

			if (details.transitionType !== "reload") {
				const url = details.url || "";

				// Khi người dùng mở dashboard tab -> lưu tab id
				if (checkIsDashboardTab(url)) {
					await DB_setValue(KEY_TAB.TAB_DASHBOARD_ID, currentId);
				}
			}
		}
	} catch (error) {
		logError("Error at handleOnCommited method: ", error);
	}
}

async function handleOnRemove(tabId) {
	try {
		const tabIdDashboard = await DB_getValue(KEY_TAB.TAB_DASHBOARD_ID);
		if (tabId === tabIdDashboard) {
			await schedulerService.clearSchedulerAlarm();
			await DB_deleteValue(KEY_TAB.TAB_DASHBOARD_ID);
		}
	} catch (error) {
		logError("Error at handleRemove", error);
	}
}

console.log("[Background] Background is running with Proxy Auth support...");
