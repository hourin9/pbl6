import { useCallback, useEffect, useMemo, useState } from "react";
import type { PriorityLevel, ReviewStatus, User } from "../types/models";
import {
  createCase,
  fetchScanImage,
  getAllQueueCases,
  getCaseDetails,
  getPatient,
  getPatients,
  logout,
  submitCaseReview,
  uploadScanImage,
  type ApiPatient,
  type ApiScanImage,
  type DashboardCase,
  type QueueOverview,
  type QueueStatusKey,
} from "../services/api";

interface Props {
  user: User;
  onBack: () => void;
}

type DoctorTab = "queue" | "create" | "history" | "patients" | "images";

const EMPTY_QUEUES: QueueOverview = {
  pending: [],
  procDone: [],
  confirmed: [],
  denied: [],
  all: [],
};

const statusLabel = (status: ReviewStatus) =>
  status === "confirmed" ? "Đã xác nhận" : status === "rejected" ? "Từ chối" : "Chờ xử lý";

const statusStyle = (status: ReviewStatus) =>
  status === "confirmed" ? "text-[#22c55e]" : status === "rejected" ? "text-[#ef4444]" : "text-[#f97316]";

const queueStageLabel = (stage?: QueueStatusKey) => {
  switch (stage) {
    case "Pending": return "Chờ AI xử lý";
    case "ProcDone": return "Chờ bác sĩ duyệt";
    case "Confirmed": return "Đã xác nhận";
    case "Denied": return "Đã từ chối";
    default: return "—";
  }
};

const priorityLabel = (priority: PriorityLevel) =>
  priority === "emergency" ? "Khẩn cấp" : priority === "review" ? "Xem xét" : "Bình thường";

const priorityStyle = (priority: PriorityLevel) =>
  priority === "emergency"
    ? "text-[#ef4444] border-[#ef4444]/30 bg-[#ef4444]/5"
    : priority === "review"
      ? "text-[#f97316] border-[#f97316]/30 bg-[#f97316]/5"
      : "text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/5";

const priorityAccent = (priority: PriorityLevel) =>
  priority === "emergency" ? "bg-[#ef4444]" : priority === "review" ? "bg-[#f97316]" : "bg-[#22c55e]";

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("vi-VN");
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/5 p-4 text-sm text-[#ef4444]">
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-lg border border-[#ef4444]/40 px-3 py-1.5 text-xs font-semibold hover:bg-[#ef4444]/10">
          Thử lại
        </button>
      )}
    </div>
  );
}

function SuccessNotice({ message }: { message: string }) {
  return (
    <div role="status" className="flex items-center gap-2.5 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/5 p-4 text-sm text-[#22c55e]">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-3 rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-6 text-sm text-[#94aec8]">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0ea5e9]/30 border-t-[#0ea5e9]" />
      {label}
    </div>
  );
}

function TabIcon({ name }: { name: DoctorTab }) {
  switch (name) {
    case "queue":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h14M3 10h14M3 15h9" />
        </svg>
      );
    case "create":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 4v12m6-6H4" />
        </svg>
      );
    case "history":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v4l2.5 1.5M4 10a6 6 0 101.76-4.24L4 7.5" />
        </svg>
      );
    case "patients":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7a3 3 0 11-6 0 3 3 0 016 0zm3 9a6 6 0 10-12 0" />
        </svg>
      );
    case "images":
      return (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4">
          <rect x="3" y="4" width="14" height="12" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 13l2.5-2.5L11 13l2.5-3L16 13" />
        </svg>
      );
  }
}

export default function LiveDoctorPortal({ user, onBack }: Props) {
  const [tab, setTab] = useState<DoctorTab>("queue");

  // Queues state
  const [queues, setQueues] = useState<QueueOverview>(EMPTY_QUEUES);
  const [queueFilter, setQueueFilter] = useState<"active" | "ProcDone" | "Pending">("active");
  const [loadingQueues, setLoadingQueues] = useState(true);
  const [queueError, setQueueError] = useState("");

  // History filters
  const [historyStage, setHistoryStage] = useState<QueueStatusKey | "all">("all");
  const [historyPriority, setHistoryPriority] = useState<PriorityLevel | "all">("all");

  // Case detail & review state
  const [selectedCase, setSelectedCase] = useState<DashboardCase | null>(null);
  const [detail, setDetail] = useState<DashboardCase | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [note, setNote] = useState("");
  const [caseIdInput, setCaseIdInput] = useState("");

  // Patients state
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(null);
  const [patientDetailLoading, setPatientDetailLoading] = useState(false);

  // Create case state
  const [createPatientId, setCreatePatientId] = useState("1");
  const [createReviewerId, setCreateReviewerId] = useState("1");
  const [createUploaderId, setCreateUploaderId] = useState("1");
  const [createNote, setCreateNote] = useState("");
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Image upload & viewer state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedImage, setUploadedImage] = useState<ApiScanImage | null>(null);
  const [imageIdInput, setImageIdInput] = useState("1");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imagePreview, setImagePreview] = useState<{ kind: "blob"; blobUrl: string; contentType: string } | { kind: "json"; data: unknown } | null>(null);

  const loadQueues = useCallback(async () => {
    setLoadingQueues(true);
    setQueueError("");
    try {
      setQueues(await getAllQueueCases());
    } catch (cause) {
      setQueueError(cause instanceof Error ? cause.message : "Không tải được hàng đợi Ca.");
    } finally {
      setLoadingQueues(false);
    }
  }, []);

  const loadPatients = useCallback(async () => {
    setPatientsLoading(true);
    setPatientsError("");
    try {
      const list = await getPatients();
      setPatients(list);
      if (list.length > 0) {
        setCreatePatientId(prev => prev || String(list[0].id));
      }
    } catch (cause) {
      setPatientsError(cause instanceof Error ? cause.message : "Không tải được danh sách bệnh nhân.");
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueues();
    void loadPatients();
  }, [loadQueues, loadPatients]);

  useEffect(() => {
    return () => {
      if (imagePreview?.kind === "blob") {
        URL.revokeObjectURL(imagePreview.blobUrl);
      }
    };
  }, [imagePreview]);

  const openCase = useCallback(async (caseItem: DashboardCase) => {
    setSelectedCase(caseItem);
    setDetail(null);
    setDetailError("");
    setReviewError("");
    setReviewSuccess("");
    setNote(caseItem.doctor_note ?? "");

    if (!caseItem.apiId) {
      setDetailError("Backend CaseDto không trả Id. Nhập mã số Ca ở ô tìm kiếm để tải chi tiết.");
      return;
    }

    setDetailLoading(true);
    try {
      const fresh = await getCaseDetails(caseItem.apiId);
      setDetail(fresh);
      setNote(fresh.doctor_note ?? "");
    } catch (cause) {
      setDetailError(cause instanceof Error ? cause.message : "Không tải được chi tiết Ca.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openById = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = Number(caseIdInput);
    if (!Number.isSafeInteger(id) || id < 1) return;
    await openCase({
      id: String(id),
      apiId: id,
      created_at: "",
      priority_level: "none",
      review_status: "pending",
      scan_count: 0,
      scans: [],
    });
  }, [caseIdInput, openCase]);

  const handleReview = useCallback(async (decision: "confirmed" | "rejected") => {
    if (!selectedCase?.apiId) return;
    setReviewLoading(true);
    setReviewError("");
    setReviewSuccess("");
    try {
      await submitCaseReview(selectedCase.apiId, decision, note);
      setReviewSuccess(decision === "confirmed" ? "Đã gửi yêu cầu xác nhận Ca lên API." : "Đã gửi yêu cầu từ chối Ca lên API.");
      await loadQueues();
      const refreshed = await getCaseDetails(selectedCase.apiId).catch(() => null);
      if (refreshed) setDetail(refreshed);
    } catch (cause) {
      setReviewError(cause instanceof Error ? cause.message : "Không lưu được quyết định.");
    } finally {
      setReviewLoading(false);
    }
  }, [loadQueues, note, selectedCase]);

  const handleCreateCase = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const patientId = Number(createPatientId);
    const reviewerId = Number(createReviewerId);
    const uploaderId = Number(createUploaderId);
    if (!Number.isSafeInteger(patientId) || patientId < 1) {
      setCreateError("PatientId phải là số nguyên dương.");
      return;
    }
    if (!Number.isSafeInteger(reviewerId) || reviewerId < 1 || !Number.isSafeInteger(uploaderId) || uploaderId < 1) {
      setCreateError("ReviewerId và UploaderId phải là số nguyên dương.");
      return;
    }

    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess("");
    let created: DashboardCase | null = null;
    try {
      created = await createCase({
        note: createNote.trim(),
        patientId,
        reviewerId,
        uploaderId,
      });
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : "Không thể tạo Ca mới.");
      setCreateLoading(false);
      return;
    }

    const idInfo = created.apiId ? ` (ID: ${created.apiId})` : "";
    if (created.apiId) setCaseIdInput(String(created.apiId));

    let uploadedCount = 0;
    try {
      for (const file of createFiles) {
        await uploadScanImage(file);
        uploadedCount += 1;
      }
      const imgInfo = uploadedCount > 0 ? ` Đã upload ${uploadedCount} ảnh qua /api/Image/upload.` : "";
      setCreateSuccess(`Đã tạo Ca mới thành công${idInfo}.${imgInfo}`);
      setCreateNote("");
      setCreateFiles([]);
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Upload ảnh thất bại.";
      setCreateSuccess(`Đã tạo Ca mới thành công${idInfo}.`);
      setCreateError(`Tạo Ca xong nhưng bước upload ảnh bị lỗi: ${msg}`);
    } finally {
      await loadQueues();
      setCreateLoading(false);
    }
  }, [createFiles, createNote, createPatientId, createReviewerId, createUploaderId, loadQueues]);

  const handleInspectPatient = useCallback(async (patient: ApiPatient) => {
    setSelectedPatient(patient);
    setPatientDetailLoading(true);
    try {
      setSelectedPatient(await getPatient(patient.id));
    } catch {
      // Keep the list item if single-fetch fails.
    } finally {
      setPatientDetailLoading(false);
    }
  }, []);

  const handleUploadStandalone = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uploadFile) return;
    setUploadLoading(true);
    setUploadError("");
    setUploadedImage(null);
    try {
      const res = await uploadScanImage(uploadFile);
      setUploadedImage(res);
      if (res.id) setImageIdInput(String(res.id));
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Upload ảnh thất bại.");
    } finally {
      setUploadLoading(false);
    }
  }, [uploadFile]);

  const handleFetchImage = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = Number(imageIdInput);
    if (!Number.isSafeInteger(id) || id < 1) return;
    setImageLoading(true);
    setImageError("");
    setImagePreview(prev => {
      if (prev?.kind === "blob") URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
    try {
      setImagePreview(await fetchScanImage(id));
    } catch (cause) {
      setImageError(cause instanceof Error ? cause.message : "Không tải được ảnh.");
    } finally {
      setImageLoading(false);
    }
  }, [imageIdInput]);

  async function handleLogout() {
    try { await logout(); } finally { onBack(); }
  }

  const activeQueueCases = useMemo(() => {
    if (queueFilter === "ProcDone") return queues.procDone;
    if (queueFilter === "Pending") return queues.pending;
    return [...queues.procDone, ...queues.pending];
  }, [queueFilter, queues.pending, queues.procDone]);

  const filteredHistory = useMemo(() => {
    return queues.all.filter(item =>
      (historyStage === "all" || item.queueStage === historyStage) &&
      (historyPriority === "all" || item.priority_level === historyPriority),
    );
  }, [historyPriority, historyStage, queues.all]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.cccd ?? "").toLowerCase().includes(q) ||
      String(p.id).includes(q),
    );
  }, [patientSearch, patients]);

  const userInitial = (user.full_name.trim().split(" ").pop()?.[0] ?? "B").toUpperCase();

  if (selectedCase) {
    const current = detail ?? selectedCase;
    return (
      <div className="min-h-screen bg-[#04091a] text-[#e8edf5]">
        <header className="sticky top-0 z-10 border-b border-[#1a2e4a] bg-[#04091a]/95 px-6 py-4">
          <div className="mx-auto flex max-w-5xl items-center gap-4">
            <button
              type="button"
              onClick={() => { setSelectedCase(null); setDetail(null); }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0ea5e9]"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 10H4m5 5-5-5 5-5" />
              </svg>
              Bảng điều khiển
            </button>
            <span className="ml-auto text-sm font-medium text-[#94aec8]">{user.full_name}</span>
          </div>
        </header>

        <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono-data text-xs text-[#64849e]">CHI TIẾT CA · GET /api/Case/{current.apiId ?? "?"}</p>
              <h1 className="mt-1 font-display text-3xl">Ca bệnh #{current.id || "—"}</h1>
            </div>
            {detail && (
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyle(detail.priority_level)}`}>
                  {priorityLabel(detail.priority_level)}
                </span>
                <span className={`rounded-full border border-[#1a2e4a] bg-[#0b1229] px-3 py-1 text-xs font-semibold ${statusStyle(detail.review_status)}`}>
                  {statusLabel(detail.review_status)}
                </span>
              </div>
            )}
          </div>

          {detailLoading && <Spinner label="Đang tải chi tiết Ca từ máy chủ…" />}
          {detailError && <ErrorNotice message={detailError} onRetry={() => void openCase(selectedCase)} />}

          {detail && !detailLoading && (
            <>
              <section className="grid gap-4 rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="font-mono-data text-[11px] text-[#64849e]">BỆNH NHÂN</div>
                  <div className="mt-1 text-base font-semibold">{detail.patient_name ?? "Backend chưa trả thông tin"}</div>
                </div>
                <div>
                  <div className="font-mono-data text-[11px] text-[#64849e]">THỜI GIAN TẠO</div>
                  <div className="mt-1 text-sm text-[#94aec8]">{formatDateTime(detail.created_at)}</div>
                </div>
                <div>
                  <div className="font-mono-data text-[11px] text-[#64849e]">THỜI GIAN DUYỆT</div>
                  <div className="mt-1 text-sm text-[#94aec8]">{formatDateTime(detail.reviewed_at)}</div>
                </div>
                <div>
                  <div className="font-mono-data text-[11px] text-[#64849e]">SỐ ẢNH SCAN</div>
                  <div className="mt-1 text-sm font-medium">{detail.scan_count} ảnh</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="font-mono-data text-[11px] text-[#64849e]">GHI CHÚ HIỆN TẠI</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-[#94aec8]">{detail.doctor_note || "Chưa có ghi chú"}</div>
                </div>
              </section>

              {detail.scans.length > 0 ? (
                <section className="space-y-3 rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-6">
                  <div className="font-mono-data text-xs text-[#64849e]">DANH SÁCH ẢNH CT ({detail.scans.length})</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {detail.scans.map(scan => (
                      <div key={scan.id} className="flex items-center justify-between rounded-xl border border-[#1a2e4a] p-3.5 text-sm">
                        <span className="truncate font-mono-data text-xs">{scan.file_path || `Scan #${scan.id}`}</span>
                        {/^\d+$/.test(scan.id) && (
                          <button
                            type="button"
                            onClick={() => {
                              setImageIdInput(scan.id);
                              setSelectedCase(null);
                              setDetail(null);
                              setTab("images");
                            }}
                            className="text-xs font-semibold text-[#0ea5e9] hover:underline"
                          >
                            Mở ảnh →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <div className="rounded-xl border border-dashed border-[#1a2e4a] p-4 text-xs text-[#64849e]">
                  Backend CaseDto hiện chưa trả kèm danh sách ảnh scan trong chi tiết Ca.
                </div>
              )}

              <section className="space-y-4 rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-6">
                <div>
                  <h2 className="font-display text-xl">Đánh giá lâm sàng</h2>
                  <p className="mt-0.5 text-xs text-[#64849e]">Ghi chú và gửi quyết định xác nhận hoặc từ chối lên backend</p>
                </div>
                <label className="block text-sm text-[#94aec8]">
                  <span className="font-mono-data text-[11px] text-[#64849e]">GHI CHÚ BÁC SỸ</span>
                  <textarea
                    value={note}
                    onChange={event => setNote(event.target.value)}
                    rows={3}
                    placeholder="Nhập nhận xét lâm sàng, kết luận hoặc hướng xử trí…"
                    className="mt-2 w-full rounded-xl border border-[#1a2e4a] bg-[#04091a] p-3.5 text-sm text-[#e8edf5]"
                  />
                </label>
                {reviewError && <ErrorNotice message={reviewError} />}
                {reviewSuccess && <SuccessNotice message={reviewSuccess} />}
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    disabled={reviewLoading}
                    onClick={() => void handleReview("confirmed")}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#15803d] disabled:opacity-50"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    {reviewLoading ? "Đang lưu…" : "Xác nhận Ca (Approve)"}
                  </button>
                  <button
                    type="button"
                    disabled={reviewLoading}
                    onClick={() => void handleReview("rejected")}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#dc2626] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b91c1c] disabled:opacity-50"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                    Từ chối Ca (Deny)
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    );
  }

  const activeTotal = queues.procDone.length + queues.pending.length;

  return (
    <div className="min-h-screen bg-[#04091a] text-[#e8edf5] flex flex-col">
      <header className="sticky top-0 z-10 border-b border-[#1a2e4a] bg-[#04091a]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3.5 px-6">
          <button
            type="button"
            onClick={() => void handleLogout()}
            title="Đăng xuất về trang chủ"
            aria-label="Đăng xuất về trang chủ"
            className="text-[#64849e] hover:text-[#e8edf5]"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 10H4m5 5-5-5 5-5" />
            </svg>
          </button>
          <span className="font-display text-lg">NeuraScan<span className="text-[#0ea5e9]">AI</span></span>
          <span className="rounded-full border border-[#0ea5e9]/25 bg-[#0ea5e9]/10 px-2.5 py-0.5 font-mono-data text-xs font-medium text-[#0ea5e9]">
            Bác sỹ
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold">{user.full_name}</div>
              <button type="button" onClick={() => void handleLogout()} className="text-xs text-[#64849e] hover:text-[#ef4444]">
                Đăng xuất
              </button>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/15 text-sm font-bold text-[#0ea5e9]">
              {userInitial}
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6">
          {([
            { key: "queue", label: `Hàng đợi Ca (${activeTotal})` },
            { key: "create", label: "Tạo Ca mới" },
            { key: "history", label: `Lịch sử Ca (${queues.all.length})` },
            { key: "patients", label: `Bệnh nhân (${patients.length})` },
            { key: "images", label: "Ảnh CT / Upload" },
          ] as const).map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                tab === item.key ? "border-[#0ea5e9] text-[#0ea5e9]" : "border-transparent text-[#64849e] hover:text-[#94aec8]"
              }`}
            >
              <TabIcon name={item.key} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-6 py-8">
        {tab === "queue" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono-data text-xs text-[#64849e]">WORKSPACE · API TRỰC TIẾP</p>
                <h2 className="mt-1 font-display text-2xl">Hàng đợi Ca bệnh</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={queueFilter}
                  onChange={event => setQueueFilter(event.target.value as "active" | "ProcDone" | "Pending")}
                  className="rounded-xl border border-[#1a2e4a] bg-[#0b1229] px-3.5 py-2 text-sm text-[#94aec8]"
                >
                  <option value="active">Tất cả hàng chờ ({activeTotal})</option>
                  <option value="ProcDone">Chờ bác sĩ duyệt — ProcDone ({queues.procDone.length})</option>
                  <option value="Pending">Chờ AI xử lý — Pending ({queues.pending.length})</option>
                </select>
                <button
                  type="button"
                  onClick={() => void loadQueues()}
                  disabled={loadingQueues}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#1a2e4a] bg-[#0b1229] px-3.5 py-2 text-sm font-medium text-[#94aec8] disabled:opacity-50"
                >
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className={`h-4 w-4 ${loadingQueues ? "animate-spin" : ""}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 10a6 6 0 0110.5-4M16 10a6 6 0 01-10.5 4M15 3v3h-3M5 17v-3h3" />
                  </svg>
                  Làm mới
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Chờ bác sĩ duyệt", value: queues.procDone.length, sub: "Queue ProcDone", tone: "text-[#f97316]" },
                { label: "Chờ AI xử lý", value: queues.pending.length, sub: "Queue Pending", tone: "text-[#0ea5e9]" },
                { label: "Đã xác nhận", value: queues.confirmed.length, sub: "Queue Confirmed", tone: "text-[#22c55e]" },
                { label: "Bệnh nhân", value: patients.length, sub: "Hồ sơ hệ thống", tone: "text-[#e8edf5]" },
              ].map(card => (
                <div key={card.label} className="rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-4">
                  <div className="font-mono-data text-[10px] tracking-wider text-[#64849e]">{card.label.toUpperCase()}</div>
                  <div className={`mt-1.5 font-display text-3xl ${card.tone}`}>{loadingQueues ? "…" : card.value}</div>
                  <div className="mt-0.5 text-xs text-[#64849e]">{card.sub}</div>
                </div>
              ))}
            </div>

            <form onSubmit={openById} className="flex flex-wrap items-end gap-3 rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-4">
              <label className="flex-1 text-xs font-mono-data text-[#64849e]">
                MỞ CHI TIẾT CA THEO ID SỐ (GET /api/Case/{"{id}"})
                <input
                  type="number"
                  min="1"
                  required
                  value={caseIdInput}
                  onChange={event => setCaseIdInput(event.target.value)}
                  placeholder="Nhập mã số Ca, ví dụ: 1"
                  className="mt-2 block w-full rounded-xl border border-[#1a2e4a] bg-[#04091a] px-3.5 py-2.5 text-sm text-[#e8edf5]"
                />
              </label>
              <button type="submit" className="rounded-xl bg-[#0ea5e9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0284c7]">
                Mở Ca
              </button>
            </form>

            {queueError && <ErrorNotice message={queueError} onRetry={() => void loadQueues()} />}
            {loadingQueues && <Spinner label="Đang tải danh sách Ca từ máy chủ…" />}
            {!loadingQueues && !queueError && activeQueueCases.length === 0 && (
              <div className="rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-12 text-center">
                <h3 className="font-display text-xl">Hàng đợi chưa có Ca</h3>
                <p className="mt-2 text-sm text-[#64849e]">Chuyển sang tab Tạo Ca mới để thêm Ca bệnh hoặc kiểm tra Lịch sử Ca.</p>
                <button
                  type="button"
                  onClick={() => setTab("create")}
                  className="mt-4 rounded-xl bg-[#0ea5e9] px-4 py-2 text-xs font-semibold text-white"
                >
                  + Tạo Ca mới
                </button>
              </div>
            )}

            {!loadingQueues && activeQueueCases.length > 0 && (
              <div className="space-y-3">
                {activeQueueCases.map((item, index) => (
                  <article
                    key={`${item.queueStage}-${item.apiId ?? index}-${item.created_at}`}
                    className="relative overflow-hidden rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-5 pl-6 transition-all hover:border-[#0ea5e9]/40"
                  >
                    <div className={`absolute inset-y-0 left-0 w-1 ${priorityAccent(item.priority_level)}`} />
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono-data text-sm font-bold">
                            {item.apiId ? `Ca #${item.id}` : `Ca #${index + 1}`}
                          </span>
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityStyle(item.priority_level)}`}>
                            {priorityLabel(item.priority_level)}
                          </span>
                          <span className="rounded-full border border-[#1a2e4a] bg-[#04091a] px-2.5 py-0.5 text-xs text-[#f97316]">
                            {queueStageLabel(item.queueStage)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[#94aec8]">
                          <span>{item.patient_name ?? "Bệnh nhân: (chưa có trong DTO)"}</span>
                          <span className="font-mono-data text-xs">{formatDateTime(item.created_at)}</span>
                          <span>{item.scan_count} ảnh</span>
                          {item.doctor_note && <span className="max-w-md truncate text-[#64849e]">Ghi chú: {item.doctor_note}</span>}
                        </div>
                      </div>
                      {item.apiId ? (
                        <button
                          type="button"
                          onClick={() => void openCase(item)}
                          className="rounded-xl bg-[#0ea5e9] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Xem chi tiết
                        </button>
                      ) : (
                        <span className="rounded-lg border border-[#1a2e4a] px-3 py-1.5 font-mono-data text-[11px] text-[#64849e]">
                          CaseDto chưa trả Id — nhập ID ở trên
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "create" && (
          <section className="mx-auto max-w-2xl space-y-5">
            <div>
              <p className="font-mono-data text-xs text-[#64849e]">POST /api/Case/create</p>
              <h2 className="mt-1 font-display text-2xl">Tạo Ca bệnh mới</h2>
              <p className="mt-1 text-xs text-[#64849e]">Chọn bệnh nhân từ hệ thống và gửi hồ sơ Ca mới lên backend</p>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-5 rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-6">
              <div>
                <label className="mb-1.5 block font-mono-data text-xs text-[#64849e]">CHỌN BỆNH NHÂN (TỪ GET /api/Patient)</label>
                {patients.length > 0 && (
                  <select
                    value={createPatientId}
                    onChange={event => setCreatePatientId(event.target.value)}
                    className="mb-2.5 w-full rounded-xl border border-[#1a2e4a] bg-[#04091a] px-3.5 py-2.5 text-sm text-[#e8edf5]"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={String(p.id)}>
                        #{p.id} — {p.name} {p.cccd ? `(CCCD: ${p.cccd})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                <label className="block text-xs text-[#94aec8]">
                  Hoặc nhập PatientId trực tiếp:
                  <input
                    type="number"
                    min="1"
                    required
                    value={createPatientId}
                    onChange={event => setCreatePatientId(event.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-[#1a2e4a] bg-[#04091a] px-3.5 py-2.5 text-sm text-[#e8edf5]"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block font-mono-data text-xs text-[#64849e]">
                  REVIEWER ID (BÁC SĨ DUYỆT)
                  <input
                    type="number"
                    min="1"
                    required
                    value={createReviewerId}
                    onChange={event => setCreateReviewerId(event.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-[#1a2e4a] bg-[#04091a] px-3.5 py-2.5 text-sm text-[#e8edf5]"
                  />
                </label>
                <label className="block font-mono-data text-xs text-[#64849e]">
                  UPLOADER ID (NGƯỜI TẢI LÊN)
                  <input
                    type="number"
                    min="1"
                    required
                    value={createUploaderId}
                    onChange={event => setCreateUploaderId(event.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-[#1a2e4a] bg-[#04091a] px-3.5 py-2.5 text-sm text-[#e8edf5]"
                  />
                </label>
              </div>

              <label className="block font-mono-data text-xs text-[#64849e]">
                GHI CHÚ LÂM SÀNG
                <textarea
                  rows={3}
                  value={createNote}
                  onChange={event => setCreateNote(event.target.value)}
                  placeholder="Mô tả triệu chứng, tiền sử hoặc ghi chú ban đầu…"
                  className="mt-1.5 block w-full rounded-xl border border-[#1a2e4a] bg-[#04091a] p-3.5 text-sm text-[#e8edf5]"
                />
              </label>

              <div>
                <label className="mb-1.5 block font-mono-data text-xs text-[#64849e]">
                  ẢNH CT ĐÍNH KÈM (TÙY CHỌN — POST /api/Image/upload)
                </label>
                <div className="rounded-xl border border-dashed border-[#1a2e4a] p-4">
                  <input
                    type="file"
                    multiple
                    accept=".dcm,.nii,.png,.jpg,.jpeg"
                    onChange={event => setCreateFiles(Array.from(event.target.files ?? []))}
                    className="block w-full text-sm text-[#94aec8]"
                  />
                  {createFiles.length > 0 && (
                    <p className="mt-2 font-mono-data text-xs text-[#0ea5e9]">
                      Đã chọn {createFiles.length} tệp: {createFiles.map(f => f.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {createError && <ErrorNotice message={createError} />}
              {createSuccess && <SuccessNotice message={createSuccess} />}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-xl bg-[#0ea5e9] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0284c7] disabled:opacity-50"
                >
                  {createLoading ? "Đang tạo Ca…" : "Tạo Ca mới"}
                </button>
              </div>
            </form>
          </section>
        )}

        {tab === "history" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono-data text-xs text-[#64849e]">GET /api/Queue/Pending · ProcDone · Confirmed · Denied</p>
                <h2 className="mt-1 font-display text-2xl">Lịch sử Ca bệnh</h2>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <select
                  value={historyStage}
                  onChange={event => setHistoryStage(event.target.value as QueueStatusKey | "all")}
                  className="rounded-xl border border-[#1a2e4a] bg-[#0b1229] px-3.5 py-2 text-sm text-[#94aec8]"
                >
                  <option value="all">Tất cả hàng đợi ({queues.all.length})</option>
                  <option value="ProcDone">ProcDone ({queues.procDone.length})</option>
                  <option value="Pending">Pending ({queues.pending.length})</option>
                  <option value="Confirmed">Confirmed ({queues.confirmed.length})</option>
                  <option value="Denied">Denied ({queues.denied.length})</option>
                </select>
                <select
                  value={historyPriority}
                  onChange={event => setHistoryPriority(event.target.value as PriorityLevel | "all")}
                  className="rounded-xl border border-[#1a2e4a] bg-[#0b1229] px-3.5 py-2 text-sm text-[#94aec8]"
                >
                  <option value="all">Tất cả mức ưu tiên</option>
                  <option value="emergency">Khẩn cấp</option>
                  <option value="review">Xem xét</option>
                  <option value="none">Bình thường</option>
                </select>
                <button
                  type="button"
                  onClick={() => void loadQueues()}
                  disabled={loadingQueues}
                  className="rounded-xl border border-[#1a2e4a] bg-[#0b1229] px-3.5 py-2 text-sm text-[#94aec8] disabled:opacity-50"
                >
                  Làm mới
                </button>
              </div>
            </div>

            {queueError && <ErrorNotice message={queueError} onRetry={() => void loadQueues()} />}

            <div className="overflow-hidden rounded-xl border border-[#1a2e4a]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a2e4a] bg-[#0b1229]">
                    {["Mã Ca", "Hàng đợi", "Bệnh nhân", "Thời gian tạo", "Mức ưu tiên", "Trạng thái", "Ghi chú", ""].map(heading => (
                      <th key={heading} className="px-4 py-3 text-left font-mono-data text-xs text-[#64849e]">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-[#64849e]">
                        Không có Ca nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item, index) => (
                      <tr key={`${item.queueStage}-${item.apiId ?? index}`} className={`border-b border-[#1a2e4a] hover:bg-[#0b1229] ${index === filteredHistory.length - 1 ? "border-b-0" : ""}`}>
                        <td className="px-4 py-3 font-mono-data text-xs font-semibold text-[#0ea5e9]">{item.apiId ? `#${item.id}` : `#${index + 1}`}</td>
                        <td className="px-4 py-3 font-mono-data text-xs text-[#94aec8]">{item.queueStage ?? "—"}</td>
                        <td className="px-4 py-3 text-sm text-[#94aec8]">{item.patient_name ?? "—"}</td>
                        <td className="px-4 py-3 font-mono-data text-xs text-[#64849e]">{formatDateTime(item.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityStyle(item.priority_level)}`}>
                            {priorityLabel(item.priority_level)}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${statusStyle(item.review_status)}`}>{statusLabel(item.review_status)}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-xs text-[#64849e]">{item.doctor_note ?? "—"}</td>
                        <td className="px-4 py-3">
                          {item.apiId && (
                            <button type="button" onClick={() => void openCase(item)} className="text-xs font-semibold text-[#0ea5e9] hover:underline">
                              Xem
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "patients" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono-data text-xs text-[#64849e]">GET /api/Patient · GET /api/Patient/{"{id}"}</p>
                <h2 className="mt-1 font-display text-2xl">Danh sách Bệnh nhân</h2>
              </div>
              <button
                type="button"
                onClick={() => void loadPatients()}
                disabled={patientsLoading}
                className="rounded-xl border border-[#1a2e4a] bg-[#0b1229] px-3.5 py-2 text-sm text-[#94aec8] disabled:opacity-50"
              >
                Làm mới
              </button>
            </div>

            <div className="relative">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64849e]">
                <circle cx="9" cy="9" r="5.5" />
                <path strokeLinecap="round" d="M13.5 13.5L17 17" />
              </svg>
              <input
                value={patientSearch}
                onChange={event => setPatientSearch(event.target.value)}
                placeholder="Tìm theo tên, CCCD hoặc ID bệnh nhân…"
                className="w-full rounded-xl border border-[#1a2e4a] bg-[#0b1229] py-2.5 pr-4 pl-10 text-sm text-[#e8edf5]"
              />
            </div>

            {patientsError && <ErrorNotice message={patientsError} onRetry={() => void loadPatients()} />}
            {patientsLoading && <Spinner label="Đang tải danh sách bệnh nhân…" />}

            {!patientsLoading && !patientsError && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="overflow-hidden rounded-xl border border-[#1a2e4a] lg:col-span-2">
                  <div className="border-b border-[#1a2e4a] bg-[#0b1229] px-5 py-3 font-mono-data text-xs text-[#64849e]">
                    {filteredPatients.length} BỆNH NHÂN
                  </div>
                  {filteredPatients.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[#64849e]">Không tìm thấy bệnh nhân.</div>
                  ) : (
                    filteredPatients.map((patient, index) => {
                      const initial = (patient.name.trim().split(" ").pop()?.[0] ?? "P").toUpperCase();
                      return (
                        <div
                          key={patient.id}
                          onClick={() => void handleInspectPatient(patient)}
                          className={`flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#0b1229] ${
                            index < filteredPatients.length - 1 ? "border-b border-[#1a2e4a]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#0ea5e9]/25 bg-[#0ea5e9]/10 text-sm font-bold text-[#0ea5e9]">
                              {initial}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[#e8edf5]">{patient.name || `Bệnh nhân #${patient.id}`}</div>
                              <div className="mt-0.5 font-mono-data text-xs text-[#64849e]">
                                ID: {patient.id} · CCCD: {patient.cccd ?? "—"} · Ngày sinh: {patient.dob || "—"}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-[#0ea5e9]">Chi tiết →</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-5">
                  <div className="mb-4 font-mono-data text-xs text-[#64849e]">CHI TIẾT BỆNH NHÂN</div>
                  {patientDetailLoading && <p className="text-sm text-[#94aec8]">Đang tải…</p>}
                  {!selectedPatient && !patientDetailLoading && (
                    <p className="text-sm text-[#64849e]">Chọn một bệnh nhân ở danh sách bên trái để xem thông tin chi tiết.</p>
                  )}
                  {selectedPatient && !patientDetailLoading && (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-[#1a2e4a] pb-2">
                        <span className="text-[#64849e]">ID</span>
                        <span className="font-mono-data font-semibold">{selectedPatient.id}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1a2e4a] pb-2">
                        <span className="text-[#64849e]">Họ tên</span>
                        <span className="font-semibold">{selectedPatient.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-[#1a2e4a] pb-2">
                        <span className="text-[#64849e]">CCCD</span>
                        <span className="font-mono-data">{selectedPatient.cccd ?? "—"}</span>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span className="text-[#64849e]">Ngày sinh</span>
                        <span className="font-mono-data">{selectedPatient.dob || "—"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCreatePatientId(String(selectedPatient.id));
                          setTab("create");
                        }}
                        className="mt-2 w-full rounded-xl bg-[#0ea5e9] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0284c7]"
                      >
                        + Tạo Ca cho bệnh nhân #{selectedPatient.id}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "images" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="space-y-4 rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-6">
              <div>
                <p className="font-mono-data text-xs text-[#64849e]">POST /api/Image/upload</p>
                <h2 className="mt-1 font-display text-xl">Tải ảnh CT lên máy chủ</h2>
              </div>
              <form onSubmit={handleUploadStandalone} className="space-y-4">
                <div className="rounded-xl border border-dashed border-[#1a2e4a] p-5">
                  <input
                    type="file"
                    accept=".dcm,.nii,.png,.jpg,.jpeg"
                    onChange={event => setUploadFile(event.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-[#94aec8]"
                  />
                </div>
                {uploadError && <ErrorNotice message={uploadError} />}
                {uploadedImage && (
                  <SuccessNotice
                    message={`Upload thành công${uploadedImage.id ? ` (Image ID: ${uploadedImage.id})` : ""}${uploadedImage.filePath ? ` · ${uploadedImage.filePath}` : ""}`}
                  />
                )}
                <button
                  type="submit"
                  disabled={!uploadFile || uploadLoading}
                  className="rounded-xl bg-[#0ea5e9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0284c7] disabled:opacity-50"
                >
                  {uploadLoading ? "Đang upload…" : "Upload ảnh"}
                </button>
              </form>
            </section>

            <section className="space-y-4 rounded-xl border border-[#1a2e4a] bg-[#0b1229] p-6">
              <div>
                <p className="font-mono-data text-xs text-[#64849e]">GET /api/Image/{"{id}"}</p>
                <h2 className="mt-1 font-display text-xl">Xem / Kiểm tra ảnh theo ID</h2>
              </div>
              <form onSubmit={handleFetchImage} className="flex items-end gap-3">
                <label className="flex-1 font-mono-data text-xs text-[#94aec8]">
                  IMAGE ID
                  <input
                    type="number"
                    min="1"
                    required
                    value={imageIdInput}
                    onChange={event => setImageIdInput(event.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-[#1a2e4a] bg-[#04091a] px-3.5 py-2.5 text-sm text-[#e8edf5]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={imageLoading}
                  className="rounded-xl bg-[#0ea5e9] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0284c7] disabled:opacity-50"
                >
                  {imageLoading ? "Đang tải…" : "Tải ảnh"}
                </button>
              </form>
              {imageError && <ErrorNotice message={imageError} />}
              {imagePreview?.kind === "blob" && (
                <div className="space-y-2 rounded-xl border border-[#1a2e4a] p-4">
                  <div className="font-mono-data text-xs text-[#64849e]">Content-Type: {imagePreview.contentType || "binary"}</div>
                  {imagePreview.contentType.startsWith("image/") ? (
                    <img src={imagePreview.blobUrl} alt={`Scan ${imageIdInput}`} className="max-h-64 rounded-lg object-contain" />
                  ) : (
                    <a
                      href={imagePreview.blobUrl}
                      download={`scan-${imageIdInput}.dcm`}
                      className="inline-block rounded-lg border border-[#0ea5e9]/40 px-3 py-2 text-xs font-semibold text-[#0ea5e9]"
                    >
                      Tải xuống tệp ảnh ({imagePreview.contentType || "application/dicom"})
                    </a>
                  )}
                </div>
              )}
              {imagePreview?.kind === "json" && (
                <pre className="max-h-60 overflow-auto rounded-xl border border-[#1a2e4a] bg-[#04091a] p-3 font-mono-data text-xs text-[#94aec8]">
                  {JSON.stringify(imagePreview.data, null, 2)}
                </pre>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
