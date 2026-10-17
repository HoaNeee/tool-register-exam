import type { IDiaDiem, IKyThiChuaDienRa } from "@/types/types";
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
import { useState } from "react";
import { examRemoteService } from "@/services/exam-remote-service";
import { handleExceptionGlobal } from "@/utils/exception";

interface Props {
  open: boolean;
  onOpenChange: (_o: boolean) => void;
  mode: "add" | "edit";
  listDiaDiemThi: IDiaDiem[];
}

export function DialogAddOrEditExam({
  open,
  onOpenChange,
  mode = "add",
  listDiaDiemThi,
}: Props) {
  const [maDiaDiemThi, setMaDiaDiemThi] = useState("");

  const [listKyThi, setListKyThi] = useState<IKyThiChuaDienRa[]>([]);

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
        <form>
          <FieldGroup>
            <Field>
              <FieldLabel>CCCD</FieldLabel>
              <Input />
            </Field>
            <Field>
              <FieldLabel>Mật Khẩu</FieldLabel>
              <Input />
            </Field>
            <Field>
              <FieldLabel>Địa điểm thi</FieldLabel>
              <Select
                onValueChange={(value) => {
                  handleSelectDiaDiemThi(value as string);
                }}
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
              <Select disabled={!maDiaDiemThi}>
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
            <Button>Lưu</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
