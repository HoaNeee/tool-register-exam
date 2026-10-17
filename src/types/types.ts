/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ICoSoLienKet {
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDiaDiem {
  code: string;
  name: string;
  shortCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface IKyThiChuaDienRa {
  ma_cap_thi: string;
  ngay_mo_dang_ky: string;
  ngay_ket_thuc_dang_ky: string;
  dia_diem: string;
  dia_diem_code: string;
  co_so_lien_ket_code: any;
  phi: string;
  trang_thai: string;
  so_luong: number;
  so_luong_toi_da: number;
  capacity_ratio: string;
  han_thanh_toan_phut: number;
  hasRegisterCode: number;
  giu_slot_khi_huy_het_han: number;
  is_hidden: number;
  moc_chot_danh_sach_thanh_toan: string;
  ngay_thi: string;
  mo_ta: string;
  yeu_cau: any;
  activated_at: any;
  created_at: string;
  updated_at: string;
  deleted_at: any;
  ten_cap_thi: string;
  cap_do: string;
  tag_advanced: string;
  dia_diem_name: string;
  co_so_lien_ket_name: any;
  so_luong_hieu_luc: number;
  so_luong_da_dang_ky: number;
  registerCode: RegisterCode;
}

export interface RegisterCode {
  totalCount: number;
  usedCount: number;
  unusedCount: number;
}

export interface IThongTinCaNhan {
  user: User;
  cccd: Cccd;
}

export interface User {
  id: number;
  cccd: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isVerified: boolean;
  is_verified: boolean;
  email_verified_at: string;
  created_at: string;
}

export interface Cccd {
  cccd: string;
  ho_ten: string;
  ngay_sinh: string;
  gioi_tinh: string;
  quoc_tich: string;
  anh_the: string;
}

export interface ResponseCheckRegistered {
  isRegistered: boolean;
  registration: string | null;
}

export interface IApiResponseVerifyToken {
  valid: boolean;
  decoded: IDecodedToken;
}

export interface IDecodedToken {
  userId: number;
  cccd: string;
  email: string;
  role: string;
  sessionId: string;
  deviceId: string;
  sessionTokenVersion: number;
  fullName: string;
  iat: number;
  exp: number;
}

export interface IApiResponseDetailExam {
  success: boolean;
  message: string;
  open_exam: OpenExam;
  questions: any[];
}

export interface OpenExam {
  ma_cap_thi: string;
  ngay_mo_dang_ky: string;
  hasRegisterCode: number;
}

export interface IResponseLogin {
  status: string;
  message: string;
  user: UserLogin;
  token: string;
  session: ISession;
}

export interface UserLogin {
  id: number;
  cccd: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  fullname: string;
  birthday: string;
  gender: number;
}

export interface ISession {
  id: string;
  device_id: string;
  expires_at: string;
}

export interface IExamRegistered {
  ma_dang_ky: string;
  ngay_dang_ky: string;
  ngay_het_han: string;
  ngay_het_han_hien_thi: string;
  deleted_at: any;
  tinh_trang: string;
  order_status: string;
  payment_gateway: string;
  ten_cap_thi: string;
  cap_do: string;
  ma_cap_thi: string;
  ngay_mo_dang_ky: string;
  phi: string;
  ngay_thi: string;
  dia_diem: string;
  typeServices: string;
}

export interface IAuth {
  token: string;
  session: ISession;
}

export interface ConfigExamTarget {
  thong_tin_ca_nhan: IThongTinCaNhan;
  exam_register: IKyThiChuaDienRa;
  auth: IAuth;
}
