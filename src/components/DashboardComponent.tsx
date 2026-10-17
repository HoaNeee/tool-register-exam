import type { ConfigExamTarget, ICoSoLienKet, IDiaDiem } from "@/types/types";
import { useEffect, useState } from "react";
import { DialogAddOrEditExam } from "./dialogs/DialogAddOrEditExam";
import { examRemoteService } from "@/services/exam-remote-service";

const INITIAL_EXAMS: ConfigExamTarget[] = [
  {
    id: "1",
    code: "INT3306",
    name: "Phát triển Ứng dụng Web",
    room: "P.302-A2",
    time: "07:30 - 09:30",
    date: "28/09/2026",
    status: "success",
    autoSnipe: true,
  },
  {
    id: "2",
    code: "MAT2023",
    name: "Xác suất Thống kê",
    room: "P.405-G2",
    time: "09:45 - 11:45",
    date: "30/09/2026",
    status: "monitoring",
    autoSnipe: true,
  },
  {
    id: "3",
    code: "PHY1100",
    name: "Vật lý Đại cương II",
    room: "P.101-E3",
    time: "13:30 - 15:30",
    date: "02/10/2026",
    status: "waiting",
    autoSnipe: false,
  },
];

export default function DashboardComponent() {
  const [exams, setExams] = useState<ConfigExamTarget[]>(INITIAL_EXAMS);
  const [listDiaDiemThi, setListDiaDiemThi] = useState<IDiaDiem[]>([]);
  const [listCoSoLienKet, setListCoSoLienKet] = useState<ICoSoLienKet[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAutoGlobal, setIsAutoGlobal] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fn = async () => {
      try {
        const diaDiems = await examRemoteService.getDiaDiemThi();
        setListDiaDiemThi(diaDiems);

        const coSos = await examRemoteService.getCoSoLienKet();
        setListCoSoLienKet(coSos);
      } catch (error) {
        console.log(error);
      }
    };
    fn();
  }, []);

  const handleDeleteExam = (id: string) => {
    setExams((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddConfigExam = (e: React.FormEvent) => {
    e.preventDefault();

    setShowAddModal(false);
  };

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
              Công cụ hỗ trợ đăng ký ca thi tự động
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs">
            <div className="text-xs text-gray-500 font-medium">
              Tổng môn theo dõi
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {exams.length}
            </div>
            <div className="text-xs text-blue-600 mt-0.5">
              {0} môn đang quét
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs">
            <div className="text-xs text-gray-500 font-medium">
              Đã đăng ký thành công
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">{0}</div>
            <div className="text-xs text-gray-400 mt-0.5">Đã chốt vị trí</div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">
                Chế độ tự động
              </div>
              <div className="text-lg font-bold text-gray-900 mt-1">
                {isAutoGlobal ? "Đang Bật" : "Đang Tắt"}
              </div>
            </div>
            <button
              onClick={() => setIsAutoGlobal(!isAutoGlobal)}
              className={`px-3 py-1 text-xs font-medium rounded cursor-pointer ${
                isAutoGlobal
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-gray-100 text-gray-600 border border-gray-300"
              }`}
            >
              {isAutoGlobal ? "Tắt Auto" : "Bật Auto"}
            </button>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-gray-200 rounded-lg">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã môn, tên môn..."
            className="w-full sm:w-72 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:border-blue-600"
          />

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md cursor-pointer transition"
          >
            + Thêm môn thi
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
                <th className="px-4 py-3">Mã môn</th>
                <th className="px-4 py-3">Tên môn</th>
                <th className="px-4 py-3">Thời gian / Phòng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Tự động</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exams.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400 text-xs"
                  >
                    Chưa có môn thi nào.
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-blue-700">
                      {exam.code}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{exam.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>{exam.time}</div>
                      <div className="text-gray-400">
                        {exam.date} • {exam.room}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {exam.status === "success" && (
                        <span className="px-2 py-0.5 text-xs rounded bg-green-50 text-green-700 border border-green-200">
                          Đã đăng ký
                        </span>
                      )}
                      {exam.status === "monitoring" && (
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Đang canh
                        </span>
                      )}
                      {exam.status === "waiting" && (
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 border border-gray-200">
                          Tạm dừng
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleAutoSnipe(exam.id)}
                        className={`text-xs px-2 py-0.5 rounded cursor-pointer font-medium ${
                          exam.autoSnipe
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {exam.autoSnipe ? "Bật" : "Tắt"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteExam(exam.id)}
                        className="text-xs text-red-600 hover:underline cursor-pointer"
                      >
                        Xóa
                      </button>
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
        />
      )}
    </div>
  );
}
