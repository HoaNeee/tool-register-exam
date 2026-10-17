import type { ICoSoLienKet, IDiaDiem, IKyThiChuaDienRa } from "@/types/types";
import { get } from "@/utils/api-request";

export const examRemoteService = {
  async getDiaDiemThi() {
    try {
      const api = "/dia-diem";
      const res = await get(api);
      return res.data as IDiaDiem[];
    } catch (error) {
      throw error;
    }
  },

  async getCoSoLienKet() {
    try {
      const api = "/co-so-lien-ket";
      const res = await get(api);
      return res.data as ICoSoLienKet[];
    } catch (error) {
      throw error;
    }
  },

  async getKyThiChuaDienRa({
    diaDiemCode = "",
    hasRegisterCode = 0,
  }: {
    diaDiemCode?: string;
    hasRegisterCode?: number;
  } = {}) {
    try {
      //https://hsk.hcmue.edu.vn/v1/api/ky-thi-mo/comming-exam?limit=1000&dia_diem_code=HUIT&hasRegisterCode=0

      let api = `/ky-thi-mo/comming-exam?limit=1000`;
      if (diaDiemCode) {
        api += `&dia_diem_code=${diaDiemCode}`;
      }
      if (hasRegisterCode) {
        api += `&hasRegisterCode=${hasRegisterCode}`;
      }
      const res = await get(api);
      console.log(res);
      return res.data as IKyThiChuaDienRa[];
    } catch (error) {
      throw error;
    }
  },
};
