const ID_TEST = "test";

const next_time_add = 1000 * 60 * 2; //2m

const generateId = () => {
	return ID_TEST + "_" + Date.now();
};

const getConfigTest = (idx: number) => {
	return {
		thong_tin_ca_nhan: {
			cccd: {
				anh_the: "",
				cccd: "0123456789",
				ho_ten: `TEST VAN TEST ${idx === 0 ? "" : idx}`,
				gioi_tinh: "Nam",
				ngay_sinh: "",
				quoc_tich: "",
			},
			user: {
				cccd: "0123456789",
				email: "test@gmail.com",
				is_verified: true,
				created_at: "",
				email_verified_at: "",
				id: 0,
				isVerified: true,
				phone: "",
				role: "user",
				status: "",
			},
		},
		auth: {
			password: "123456",
			session: { device_id: "123", expires_at: "", id: "" },
			token: "123",
		},
		is_auto_register: true,
		id: ID_TEST + idx,
		exam_register: {
			cap_do: "HSK_1",
			ma_cap_thi: "HSK_1",
			ten_cap_thi: "HSK_1 TEST",
			ngay_mo_dang_ky: new Date(Date.now() + next_time_add).toLocaleString(
				"en",
			),
		},
	};
};

export { ID_TEST, getConfigTest };
