import { useCallback, useEffect, useMemo, useState } from "react";
import type { SystemConfig, User } from "../types/models";

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  confidence_threshold: 70,
  emergency_threshold: 90,
  auto_alert: true,
  fallback_on_no_duty: true,
};
import {
  checkApiHealth,
  getAllQueueCases,
  getPatients,
  getUser,
  getUsers,
  logout,
  type ApiHealthStatus,
  type ApiPatient,
  type ApiUser,
  type QueueOverview,
} from "../services/api";

interface Props {
  user: User;
  onBack: () => void;
}

type Tab = "dashboard" | "users" | "config" | "system";

const EMPTY_QUEUES: QueueOverview = {
  pending: [],
  procDone: [],
  confirmed: [],
  denied: [],
  all: [],
};

const BACKEND_ENDPOINTS = [
  ["POST", "/api/Auth/login", "Đăng nhập (cookie session)"],
  ["POST", "/api/Auth/logout", "Đăng xuất"],
  ["GET", "/api/Queue/Pending", "Hàng đợi chờ AI xử lý"],
  ["GET", "/api/Queue/ProcDone", "Hàng đợi chờ bác sĩ duyệt"],
  ["GET", "/api/Queue/Confirmed", "Danh sách Ca đã xác nhận"],
  ["GET", "/api/Queue/Denied", "Danh sách Ca đã từ chối"],
  ["GET", "/api/Case/{id}", "Chi tiết Ca theo ID"],
  ["POST", "/api/Case/create", "Tạo Ca mới"],
  ["POST", "/api/Case/{id}/approve", "Xác nhận Ca"],
  ["POST", "/api/Case/{id}/deny", "Từ chối Ca"],
  ["GET", "/api/Patient", "Danh sách bệnh nhân"],
  ["GET", "/api/Patient/{id}", "Chi tiết bệnh nhân"],
  ["GET", "/api/User", "Danh sách người dùng"],
  ["GET", "/api/User/{id}", "Chi tiết người dùng"],
  ["GET", "/api/Image/{id}", "Tải ảnh scan"],
  ["POST", "/api/Image/upload", "Upload ảnh scan"],
  ["GET", "/api/Hello", "Kiểm tra kết nối API"],
] as const;

export default function AdminPortal({ user, onBack }: Props) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [queues, setQueues] = useState<QueueOverview>(EMPTY_QUEUES);
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lookup user by ID (GET /api/User/{id})
  const [lookupUserId, setLookupUserId] = useState("1");
  const [lookupUserResult, setLookupUserResult] = useState<ApiUser | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  // Local threshold configuration preview (backend has no /api/config endpoint yet)
  const [config, setConfig] = useState(DEFAULT_SYSTEM_CONFIG);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState(DEFAULT_SYSTEM_CONFIG);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [userList, queueData, patientList, healthRes] = await Promise.all([
        getUsers(),
        getAllQueueCases(),
        getPatients(),
        checkApiHealth(),
      ]);
      setUsers(userList);
      setQueues(queueData);
      setPatients(patientList);
      setHealth(healthRes);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được dữ liệu quản trị từ API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleLookupUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Number(lookupUserId);
    if (!Number.isSafeInteger(id) || id < 1) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupUserResult(null);
    try {
      setLookupUserResult(await getUser(id));
    } catch (cause) {
      setLookupError(cause instanceof Error ? cause.message : "Không tìm thấy người dùng.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleLogout() {
    try { await logout(); } finally { onBack(); }
  }

  function handleSaveConfig() {
    setConfig(configDraft);
    setEditingConfig(false);
  }

  const totalCases = queues.all.length;
  const confirmedCases = queues.confirmed.length;
  const deniedCases = queues.denied.length;
  const awaitingReview = queues.procDone.length;
  const pendingModel = queues.pending.length;
  const emergencyCases = queues.all.filter(c => c.priority_level === "emergency").length;
  const reviewCases = queues.all.filter(c => c.priority_level === "review").length;
  const normalCases = queues.all.filter(c => c.priority_level === "none").length;
  const confirmRate = totalCases > 0 ? Math.round((confirmedCases / totalCases) * 100) : 0;

  const onDutyDoctors = useMemo(
    () => users.filter(u => !u.isAdmin && u.onShift),
    [users],
  );

  const initials = (user.full_name.trim().split(" ").pop()?.[0] ?? "A").toUpperCase();

  return (
    <div className="min-h-screen bg-[#04091a] text-[#e8edf5] flex flex-col">
      <header className="border-b border-[#1a2e4a] bg-[#04091a]/95 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <button type="button" onClick={() => void handleLogout()} title="Đăng xuất" className="text-[#64849e] hover:text-[#e8edf5] transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div className="h-4 w-px bg-[#1a2e4a]" />
          <span className="font-display text-lg">NeuraScan<span className="text-[#0ea5e9]">AI</span></span>
          <div className="ml-2 px-2 py-0.5 rounded-full bg-[#f97316]/10 border border-[#f97316]/20 text-[#f97316] font-mono-data text-xs">Admin</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="font-mono-data text-xs text-[#22c55e]">{onDutyDoctors.length} bác sỹ đang trực</span>
            </div>
            <button type="button" onClick={() => void loadData()} disabled={loading} className="text-xs border border-[#1a2e4a] px-2.5 py-1 rounded-lg text-[#94aec8] disabled:opacity-50">
              {loading ? "Đang tải…" : "Làm mới"}
            </button>
            <div className="w-8 h-8 rounded-full bg-[#f97316]/20 border border-[#f97316]/30 flex items-center justify-center text-[#f97316] text-sm font-semibold" title={user.full_name}>{initials}</div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 flex gap-0 overflow-x-auto">
          {([
            { key: "dashboard", label: "Thống kê" },
            { key: "users", label: `Người dùng (${users.length})` },
            { key: "config", label: "Cấu hình" },
            { key: "system", label: "Hệ thống & API" },
          ] as const).map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`px-5 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${tab === t.key ? "border-[#f97316] text-[#f97316]" : "border-transparent text-[#64849e] hover:text-[#94aec8]"}`}>{t.label}</button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {error && (
          <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/5 p-4 text-sm text-[#ef4444]">
            <span>{error}</span>
            <button type="button" onClick={() => void loadData()} className="rounded-md border border-[#ef4444]/40 px-3 py-1.5 hover:bg-[#ef4444]/10">Thử lại</button>
          </div>
        )}

        {tab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl">Thống kê hệ thống (API trực tiếp)</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Tổng số Ca", value: String(totalCases), sub: `${pendingModel} chờ AI · ${awaitingReview} chờ duyệt`, color: "text-[#e8edf5]" },
                { label: "Ca Khẩn cấp", value: String(emergencyCases), sub: `${reviewCases} xem xét · ${normalCases} bình thường`, color: "text-[#ef4444]" },
                { label: "Tỷ lệ xác nhận", value: `${confirmRate}%`, sub: `${confirmedCases}/${totalCases} Ca đã xác nhận`, color: "text-[#22c55e]" },
                { label: "Bệnh nhân", value: String(patients.length), sub: `${users.length} tài khoản hệ thống`, color: "text-[#0ea5e9]" },
              ].map(k => (
                <div key={k.label} className="border border-[#1a2e4a] rounded-xl p-5 bg-[#0b1229]">
                  <div className="font-mono-data text-xs text-[#64849e] mb-2">{k.label.toUpperCase()}</div>
                  <div className={`font-display text-3xl mb-1 ${k.color}`}>{loading ? "…" : k.value}</div>
                  <div className="text-xs text-[#64849e]">{k.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="border border-[#1a2e4a] rounded-xl p-5 bg-[#0b1229]">
                <div className="font-mono-data text-xs text-[#64849e] mb-4">PHÂN BỐ MỨC ƯU TIÊN</div>
                <div className="space-y-3">
                  {[
                    { label: "Khẩn cấp (Emergency)", count: emergencyCases, color: "#ef4444" },
                    { label: "Xem xét (Review)", count: reviewCases, color: "#f97316" },
                    { label: "Bình thường (None)", count: normalCases, color: "#22c55e" },
                  ].map(t => (
                    <div key={t.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: t.color }}>{t.label}</span>
                        <span className="font-mono-data text-[#64849e]">{t.count} Ca</span>
                      </div>
                      <div className="h-2 bg-[#04091a] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${totalCases > 0 ? (t.count / totalCases) * 100 : 0}%`, backgroundColor: t.color, opacity: 0.85 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-[#1a2e4a] rounded-xl p-5 bg-[#0b1229]">
                <div className="font-mono-data text-xs text-[#64849e] mb-4">TRẠNG THÁI HÀNG ĐỢI (QUEUE API)</div>
                <div className="space-y-3">
                  {[
                    { label: "Chờ AI xử lý (GET /api/Queue/Pending)", count: pendingModel, color: "#94aec8" },
                    { label: "Chờ bác sĩ duyệt (GET /api/Queue/ProcDone)", count: awaitingReview, color: "#f97316" },
                    { label: "Đã xác nhận (GET /api/Queue/Confirmed)", count: confirmedCases, color: "#22c55e" },
                    { label: "Đã từ chối (GET /api/Queue/Denied)", count: deniedCases, color: "#ef4444" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[#94aec8]">{s.label}</span>
                      </div>
                      <span className="font-mono-data font-semibold" style={{ color: s.color }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl">Quản lý tài khoản (GET /api/User)</h2>
                <p className="text-xs text-[#64849e] mt-1">Dữ liệu người dùng lấy trực tiếp từ backend ASP.NET</p>
              </div>
            </div>

            <div className="border border-[#22c55e]/20 bg-[#22c55e]/5 rounded-xl p-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse shrink-0" />
              <span className="text-sm text-[#22c55e]">
                Đang trực ca: {onDutyDoctors.map(u => u.fullName).join(", ") || "Không có bác sỹ nào đang bật OnShift"}
              </span>
            </div>

            <form onSubmit={handleLookupUser} className="flex flex-wrap items-end gap-3 rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-4">
              <label className="flex-1 text-xs text-[#94aec8]">
                TRA CỨU USER THEO ID (GET /api/User/{"{id}"})
                <input
                  type="number"
                  min="1"
                  required
                  value={lookupUserId}
                  onChange={e => setLookupUserId(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-[#1a2e4a] bg-[#04091a] px-3 py-2 text-sm text-[#e8edf5]"
                />
              </label>
              <button type="submit" disabled={lookupLoading} className="rounded-lg bg-[#0ea5e9] px-4 py-2 text-sm text-white hover:bg-[#0284c7] disabled:opacity-50">
                {lookupLoading ? "Đang tìm…" : "Tra cứu"}
              </button>
            </form>

            {lookupError && <p className="text-sm text-[#ef4444]">{lookupError}</p>}
            {lookupUserResult && (
              <div className="rounded-xl border border-[#0ea5e9]/30 bg-[#0b1229] p-4 text-sm">
                <span className="font-semibold">{lookupUserResult.fullName}</span> · Khoa: {lookupUserResult.department || "—"} · Vai trò: {lookupUserResult.isAdmin ? "Admin" : "Bác sỹ"} · {lookupUserResult.onShift ? "Đang trực" : "Không trực"}
              </div>
            )}

            <div className="border border-[#1a2e4a] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a2e4a] bg-[#0b1229]">
                    {["#", "Họ tên", "Vai trò", "Khoa", "Trạng thái trực"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-mono-data text-xs text-[#64849e]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64849e]">
                        {loading ? "Đang tải danh sách tài khoản…" : "Chưa có dữ liệu người dùng."}
                      </td>
                    </tr>
                  ) : (
                    users.map((u, i) => (
                      <tr key={`${u.fullName}-${i}`} className={`border-b border-[#1a2e4a] hover:bg-[#0b1229] ${i === users.length - 1 ? "border-b-0" : ""}`}>
                        <td className="px-4 py-3 font-mono-data text-xs text-[#64849e]">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${u.isAdmin ? "bg-[#f97316]/20 text-[#f97316]" : "bg-[#0ea5e9]/20 text-[#0ea5e9]"}`}>
                              {(u.fullName.trim().split(" ").pop()?.[0] ?? "U").toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{u.fullName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${u.isAdmin ? "text-[#f97316] border-[#f97316]/30 bg-[#f97316]/5" : "text-[#0ea5e9] border-[#0ea5e9]/30 bg-[#0ea5e9]/5"}`}>
                            {u.isAdmin ? "Admin" : "Bác sỹ"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#94aec8]">{u.department || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full border ${u.onShift ? "text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/5" : "text-[#64849e] border-[#1a2e4a]"}`}>
                            {u.onShift ? "● Đang trực" : "○ Không trực"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "config" && (
          <div className="max-w-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-2xl">Cấu hình ngưỡng cảnh báo</h2>
              {!editingConfig && (
                <button type="button" onClick={() => { setConfigDraft(config); setEditingConfig(true); }} className="px-4 py-2 border border-[#1a2e4a] text-[#94aec8] text-sm rounded-lg hover:text-[#e8edf5] hover:border-[#0ea5e9]/30 transition-colors">
                  Chỉnh sửa
                </button>
              )}
            </div>
            <p className="text-xs text-[#64849e] mb-6">Chế độ xem cục bộ — backend hiện chưa cung cấp API đọc/ghi cấu hình hệ thống.</p>

            <div className="border border-[#1a2e4a] rounded-xl bg-[#0b1229] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1a2e4a] bg-[#04091a]">
                <div className="font-mono-data text-xs text-[#64849e]">SystemConfig · 4 khoá</div>
              </div>

              <div className="divide-y divide-[#1a2e4a]">
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-mono-data text-sm text-[#0ea5e9] mb-0.5">confidence_threshold</div>
                      <div className="text-xs text-[#64849e]">Ngưỡng confidence tối thiểu để tính Ca là &quot;review&quot;.</div>
                    </div>
                    <div className="text-right">
                      {editingConfig
                        ? <input type="number" min={50} max={99} value={configDraft.confidence_threshold} onChange={e => setConfigDraft(prev => ({ ...prev, confidence_threshold: Number(e.target.value) }))} className="w-20 bg-[#04091a] border border-[#0ea5e9]/40 rounded-md px-2 py-1 text-right font-mono-data text-sm text-[#e8edf5] focus:outline-none" />
                        : <div className="font-mono-data text-xl text-[#e8edf5]">{config.confidence_threshold}<span className="text-sm text-[#64849e]">%</span></div>}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-mono-data text-sm text-[#ef4444] mb-0.5">emergency_threshold</div>
                      <div className="text-xs text-[#64849e]">Ngưỡng confidence để nâng priority_level = emergency.</div>
                    </div>
                    <div className="text-right">
                      {editingConfig
                        ? <input type="number" min={70} max={99} value={configDraft.emergency_threshold} onChange={e => setConfigDraft(prev => ({ ...prev, emergency_threshold: Number(e.target.value) }))} className="w-20 bg-[#04091a] border border-[#ef4444]/40 rounded-md px-2 py-1 text-right font-mono-data text-sm text-[#e8edf5] focus:outline-none" />
                        : <div className="font-mono-data text-xl text-[#ef4444]">{config.emergency_threshold}<span className="text-sm text-[#64849e]">%</span></div>}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono-data text-sm text-[#0ea5e9] mb-0.5">auto_alert</div>
                    <div className="text-xs text-[#64849e]">Tự động gửi cảnh báo khi phát hiện emergency.</div>
                  </div>
                  <button type="button" onClick={() => editingConfig && setConfigDraft(prev => ({ ...prev, auto_alert: !prev.auto_alert }))} className={`w-11 h-6 rounded-full transition-colors relative ${(editingConfig ? configDraft.auto_alert : config.auto_alert) ? "bg-[#0ea5e9]" : "bg-[#1a2e4a]"}`}><div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${(editingConfig ? configDraft.auto_alert : config.auto_alert) ? "translate-x-5" : "translate-x-0"}`} /></button>
                </div>

                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-mono-data text-sm text-[#0ea5e9] mb-0.5">fallback_on_no_duty</div>
                    <div className="text-xs text-[#64849e]">Nếu không có bác sỹ on_duty → gửi alert tới toàn bộ khoa.</div>
                  </div>
                  <button type="button" onClick={() => editingConfig && setConfigDraft(prev => ({ ...prev, fallback_on_no_duty: !prev.fallback_on_no_duty }))} className={`w-11 h-6 rounded-full transition-colors relative ${(editingConfig ? configDraft.fallback_on_no_duty : config.fallback_on_no_duty) ? "bg-[#0ea5e9]" : "bg-[#1a2e4a]"}`}><div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${(editingConfig ? configDraft.fallback_on_no_duty : config.fallback_on_no_duty) ? "translate-x-5" : "translate-x-0"}`} /></button>
                </div>
              </div>
            </div>

            {editingConfig && (
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={handleSaveConfig} className="px-5 py-2.5 bg-[#0ea5e9] text-white text-sm rounded-lg hover:bg-[#0284c7] transition-colors">Lưu tạm</button>
                <button type="button" onClick={() => setEditingConfig(false)} className="px-5 py-2.5 border border-[#1a2e4a] text-[#64849e] text-sm rounded-lg hover:text-[#e8edf5] transition-colors">Huỷ</button>
              </div>
            )}
          </div>
        )}

        {tab === "system" && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl">Hệ thống & Kiểm tra kết nối</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className={`border rounded-xl p-4 ${health?.ok ? "border-[#1a2e4a] bg-[#0b1229]" : "border-[#ef4444]/30 bg-[#ef4444]/5"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${health?.ok ? "bg-[#22c55e]" : "bg-[#ef4444]"} animate-pulse`} />
                  <span className="font-mono-data text-xs text-[#64849e]">ASP.NET API Server</span>
                </div>
                <div className={`text-sm font-medium mb-0.5 ${health?.ok ? "text-[#e8edf5]" : "text-[#ef4444]"}`}>
                  {health ? (health.ok ? `200 OK · ${health.latencyMs}ms · "${health.message}"` : health.message) : "Đang kiểm tra…"}
                </div>
                <div className="font-mono-data text-xs text-[#64849e]">GET /api/Hello</div>
              </div>

              <div className="border border-[#1a2e4a] rounded-xl p-4 bg-[#0b1229]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  <span className="font-mono-data text-xs text-[#64849e]">Vite Proxy Target</span>
                </div>
                <div className="text-sm font-medium mb-0.5 text-[#e8edf5]">/api → Backend</div>
                <div className="font-mono-data text-xs text-[#64849e]">VITE_API_PROXY_TARGET=http://localhost:5134</div>
              </div>

              <div className="border border-[#1a2e4a] rounded-xl p-4 bg-[#0b1229]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
                  <span className="font-mono-data text-xs text-[#64849e]">Dữ liệu đã đồng bộ</span>
                </div>
                <div className="text-sm font-medium mb-0.5 text-[#e8edf5]">{totalCases} Ca · {patients.length} Bệnh nhân · {users.length} User</div>
                <div className="font-mono-data text-xs text-[#64849e]">Cookie Authentication</div>
              </div>
            </div>

            <div className="border border-[#1a2e4a] rounded-xl p-5 bg-[#0b1229]">
              <div className="font-mono-data text-xs text-[#64849e] mb-3">BACKEND API ENDPOINTS ĐANG KẾT NỐI</div>
              <div className="grid md:grid-cols-2 gap-2">
                {BACKEND_ENDPOINTS.map(([method, path, desc]) => (
                  <div key={`${method}-${path}`} className="flex items-baseline gap-2">
                    <span className={`text-xs font-bold shrink-0 ${method === "GET" ? "text-[#22c55e]" : "text-[#0ea5e9]"}`}>{method}</span>
                    <span className="font-mono-data text-xs text-[#94aec8]">{path}</span>
                    <span className="text-xs text-[#64849e]">— {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
