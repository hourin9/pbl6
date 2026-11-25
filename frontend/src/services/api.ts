import type { Case, PriorityLevel, ReviewStatus, User } from "../types/models";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
type JsonRecord = Record<string, unknown>;

export type QueueStatusKey = "Pending" | "ProcDone" | "Confirmed" | "Denied";

export interface DashboardCase extends Case {
  apiId?: number;
  queueStage?: QueueStatusKey;
}

export interface ApiPatient {
  id: number;
  cccd?: string | null;
  name: string;
  dob: string;
}

export interface ApiUser {
  fullName: string;
  department: string;
  isAdmin: boolean;
  onShift: boolean;
}

export interface ApiScanImage {
  id?: number;
  filePath?: string;
  caseId?: number;
  uploaderId?: number;
}

export interface CreateCasePayload {
  note: string;
  patientId: number;
  reviewerId: number;
  uploaderId: number;
}

export interface QueueOverview {
  pending: DashboardCase[];
  procDone: DashboardCase[];
  confirmed: DashboardCase[];
  denied: DashboardCase[];
  all: DashboardCase[];
}

export interface ApiHealthStatus {
  ok: boolean;
  message: string;
  latencyMs: number;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function field(record: JsonRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function getApiErrorMessage(status: number, body: unknown, statusText: string, path = ""): string {
  const raw = typeof body === "string"
    ? body
    : isRecord(body)
      ? String(field(body, "message", "title", "detail") ?? "")
      : "";

  // Do not display ASP.NET exception pages: they can contain stack traces and request details.
  if (/AmbiguousMatchException|matched multiple endpoints/i.test(raw)) {
    return "Backend trả lỗi định tuyến API. Kiểm tra route của endpoint trong backend và thử lại.";
  }
  if (status === 401) return "Sai tên đăng nhập hoặc mật khẩu, hoặc phiên đăng nhập đã hết hạn.";
  if (status === 403) return "Tài khoản không có quyền thực hiện thao tác này.";
  if (status >= 500) return `Máy chủ API gặp lỗi (${status})${path ? ` tại ${path}` : ""}. Xem chi tiết trong cửa sổ terminal backend.`;
  if (status === 404) return "Không tìm thấy API hoặc dữ liệu yêu cầu (404). Kiểm tra endpoint và mã Ca.";

  const plainMessage = raw.trim();
  if (plainMessage && plainMessage.length <= 240 && !/<[^>]+>/.test(plainMessage)) return plainMessage;
  return `Yêu cầu API thất bại (${status})${statusText ? `: ${statusText}` : "."}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json, text/plain, */*",
        ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Không kết nối được API. Chạy backend và kiểm tra VITE_API_PROXY_TARGET hoặc VITE_API_BASE_URL.");
  }

  if (response.redirected && response.url.toLowerCase().includes("/login")) {
    throw new ApiError("Phiên đăng nhập không hợp lệ hoặc cookie chưa được gửi kèm (server chuyển hướng /login).", 401);
  }

  const text = response.status === 204 ? "" : await response.text();
  let body: unknown;
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  if (!response.ok) throw new ApiError(getApiErrorMessage(response.status, body, response.statusText, path), response.status);

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html") || (typeof body === "string" && /^\s*<!doctype|^\s*<html/i.test(body))) {
    throw new ApiError(`Endpoint ${path} trả về HTML thay vì JSON. Kiểm tra đang chạy frontend bằng "npm run dev" và backend đang hoạt động.`);
  }

  return body as T;
}

/** AuthController expects { Name, Password } and sets an authentication cookie on success. */
export async function login(name: string, password: string): Promise<void> {
  await request<void>("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify({ Name: name, Password: password }),
  });
}

export async function logout(): Promise<void> {
  await request<void>("/api/Auth/logout", { method: "POST" });
}

function parsePriority(value: unknown): PriorityLevel {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized.includes("emergency") || normalized.includes("urgent")) return "emergency";
    if (normalized.includes("review")) return "review";
    return "none";
  }
  if (typeof value === "number") return value >= 2 ? "emergency" : value === 1 ? "review" : "none";
  return "none";
}

function parseReviewStatus(value: unknown, fallbackStatus: ReviewStatus = "pending"): ReviewStatus {
  if (value === undefined || value === null) return fallbackStatus;
  const status = isRecord(value) ? String(field(value, "name", "Name") ?? "") : String(value);
  const normalized = status.trim().toLowerCase();
  if (!normalized) return fallbackStatus;
  if (normalized.includes("denied") || normalized.includes("reject")) return "rejected";
  if (normalized.includes("confirm") || normalized === "approved") return "confirmed";
  if (normalized.includes("pending") || normalized.includes("done") || normalized.includes("process")) return "pending";
  return fallbackStatus;
}

export function mapApiCase(
  value: unknown,
  fallbackId?: number,
  fallbackStatus: ReviewStatus = "pending",
  queueStage?: QueueStatusKey,
): DashboardCase {
  const record = isRecord(value) ? value : {};
  const patientValue = field(record, "patient", "Patient");
  const patient = isRecord(patientValue) ? patientValue : {};
  const imagesValue = field(record, "images", "Images", "scans", "Scans");
  const images = Array.isArray(imagesValue) ? imagesValue : [];
  const rawId = field(record, "id", "Id", "caseId", "CaseId") ?? fallbackId;
  const apiId = typeof rawId === "number"
    ? rawId
    : typeof rawId === "string" && /^\d+$/.test(rawId) ? Number(rawId) : undefined;

  return {
    id: rawId === undefined ? "—" : String(rawId),
    apiId,
    queueStage,
    created_at: String(field(record, "createdAt", "CreatedAt", "created_at") ?? ""),
    priority_level: parsePriority(field(record, "priorityLevel", "PriorityLevel", "priority_level")),
    review_status: parseReviewStatus(field(record, "reviewStatus", "ReviewStatus", "status", "Status"), fallbackStatus),
    reviewed_at: field(record, "reviewedAt", "ReviewedAt") as string | undefined,
    doctor_note: String(field(record, "note", "Note", "doctorNote") ?? "") || undefined,
    patient_name: String(field(patient, "name", "Name", "fullName", "FullName") ?? "") || undefined,
    scan_count: images.length,
    scans: images.map((image, index) => {
      const scan = isRecord(image) ? image : {};
      return {
        id: String(field(scan, "id", "Id") ?? `scan-${index}`),
        case_id: String(rawId ?? ""),
        file_path: String(field(scan, "filePath", "FilePath", "file_path") ?? ""),
        uploaded_by: String(field(scan, "uploaderId", "UploaderId") ?? ""),
        uploaded_at: "",
        status: "done" as const,
      };
    }),
  };
}

function responseRows(response: unknown, errorLabel = "API"): unknown[] {
  if (Array.isArray(response)) return response;
  if (isRecord(response)) {
    const rows = field(response, "items", "cases", "data", "value", "Value", "$values");
    if (Array.isArray(rows)) return rows;
    const keys = Object.keys(response).join(", ");
    throw new ApiError(`${errorLabel} trả về object không có mảng dữ liệu (keys: ${keys || "rỗng"}).`);
  }
  const preview = typeof response === "string" ? response.slice(0, 80) : String(response);
  throw new ApiError(`${errorLabel} trả về dữ liệu không đúng định dạng (${typeof response}: ${preview}).`);
}

const queueStatusMap: Record<QueueStatusKey, ReviewStatus> = {
  Pending: "pending",
  ProcDone: "pending",
  Confirmed: "confirmed",
  Denied: "rejected",
};

export async function getQueueCases(queue: QueueStatusKey): Promise<DashboardCase[]> {
  const response = await request<unknown>(`/api/Queue/${queue}`);
  const defaultStatus = queueStatusMap[queue];
  return responseRows(response, `API Queue/${queue}`).map(item =>
    mapApiCase(item, undefined, defaultStatus, queue),
  );
}

export async function getAllQueueCases(): Promise<QueueOverview> {
  const [pending, procDone, confirmed, denied] = await Promise.all([
    getQueueCases("Pending"),
    getQueueCases("ProcDone"),
    getQueueCases("Confirmed"),
    getQueueCases("Denied"),
  ]);
  return {
    pending,
    procDone,
    confirmed,
    denied,
    all: [...procDone, ...pending, ...confirmed, ...denied],
  };
}

/** PBL6 exposes named queue routes; ProcDone is the model-complete review queue. */
export async function getDashboardCases(): Promise<DashboardCase[]> {
  return getQueueCases("ProcDone");
}

export async function getCaseDetails(id: number): Promise<DashboardCase> {
  return mapApiCase(await request<unknown>(`/api/Case/${id}`), id);
}

/** CaseController.Create accepts [FromBody] CaseCreateDto JSON { Note, PatientId, ReviewerId, UploaderId }. */
export async function createCase(payload: CreateCasePayload): Promise<DashboardCase> {
  const response = await request<unknown>("/api/Case/create", {
    method: "POST",
    body: JSON.stringify({
      Note: payload.note,
      PatientId: payload.patientId,
      ReviewerId: payload.reviewerId,
      UploaderId: payload.uploaderId,
    }),
  });
  return mapApiCase(response);
}

/**
 * PBL6 has approve/deny POST routes.
 */
export async function submitCaseReview(id: number, decision: "confirmed" | "rejected", note: string): Promise<void> {
  await request<void>(`/api/Case/${id}/${decision === "confirmed" ? "approve" : "deny"}`, {
    method: "POST",
    body: JSON.stringify(note),
  });
}

function mapApiPatient(value: unknown): ApiPatient {
  const record = isRecord(value) ? value : {};
  const rawId = field(record, "id", "Id");
  const id = typeof rawId === "number" ? rawId : Number(rawId ?? 0);
  const rawCccd = field(record, "cccd", "CCCD");
  return {
    id: Number.isFinite(id) ? id : 0,
    cccd: rawCccd === undefined || rawCccd === null ? null : String(rawCccd),
    name: String(field(record, "name", "Name") ?? ""),
    dob: String(field(record, "dob", "DOB") ?? ""),
  };
}

export async function getPatients(): Promise<ApiPatient[]> {
  const response = await request<unknown>("/api/Patient");
  return responseRows(response, "API Patient").map(mapApiPatient);
}

export async function getPatient(id: number): Promise<ApiPatient> {
  const response = await request<unknown>(`/api/Patient/${id}`);
  return mapApiPatient(response);
}

function mapApiUser(value: unknown): ApiUser {
  const record = isRecord(value) ? value : {};
  const deptValue = field(record, "department", "Department");
  const deptName = isRecord(deptValue)
    ? String(field(deptValue, "name", "Name") ?? "")
    : typeof deptValue === "string" ? deptValue : "";

  return {
    fullName: String(field(record, "fullName", "FullName", "name", "Name") ?? ""),
    department: deptName,
    isAdmin: Boolean(field(record, "isAdmin", "IsAdmin")),
    onShift: Boolean(field(record, "onShift", "OnShift")),
  };
}

export async function getUsers(): Promise<ApiUser[]> {
  const response = await request<unknown>("/api/User");
  return responseRows(response, "API User").map(mapApiUser);
}

export async function getUser(id: number): Promise<ApiUser> {
  const response = await request<unknown>(`/api/User/${id}`);
  return mapApiUser(response);
}

/** ImageController.Upload expects multipart/form-data with field name `f`. */
export async function uploadScanImage(file: File): Promise<ApiScanImage> {
  const formData = new FormData();
  formData.append("f", file);
  const response = await request<unknown>("/api/Image/upload", {
    method: "POST",
    body: formData,
  });
  const record = isRecord(response) ? response : {};
  const rawId = field(record, "id", "Id");
  const rawCaseId = field(record, "caseId", "CaseId");
  const rawUploaderId = field(record, "uploaderId", "UploaderId");
  return {
    id: typeof rawId === "number" ? rawId : undefined,
    filePath: String(field(record, "filePath", "FilePath") ?? "") || undefined,
    caseId: typeof rawCaseId === "number" ? rawCaseId : undefined,
    uploaderId: typeof rawUploaderId === "number" ? rawUploaderId : undefined,
  };
}

export function getScanImageUrl(id: number): string {
  return `${API_BASE_URL}/api/Image/${id}`;
}

export async function fetchScanImage(
  id: number,
): Promise<{ kind: "blob"; blobUrl: string; contentType: string } | { kind: "json"; data: unknown }> {
  let response: Response;
  try {
    response = await fetch(getScanImageUrl(id), { credentials: "include" });
  } catch {
    throw new ApiError("Không kết nối được API ảnh (/api/Image).");
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok) {
    const text = await response.text();
    let body: unknown = text;
    try { body = text ? JSON.parse(text) : ""; } catch { /* plain text */ }
    throw new ApiError(getApiErrorMessage(response.status, body, response.statusText), response.status);
  }
  if (contentType.includes("application/json")) {
    return { kind: "json", data: await response.json() };
  }
  const blob = await response.blob();
  return { kind: "blob", blobUrl: URL.createObjectURL(blob), contentType };
}

export async function checkApiHealth(): Promise<ApiHealthStatus> {
  const started = performance.now();
  try {
    const message = await request<string>("/api/Hello");
    const latencyMs = Math.max(1, Math.round(performance.now() - started));
    return { ok: true, message: typeof message === "string" ? message : "OK", latencyMs };
  } catch (cause) {
    const latencyMs = Math.max(1, Math.round(performance.now() - started));
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : "Không kết nối được API",
      latencyMs,
    };
  }
}

/** Login currently returns no user profile, so use the entered name and selected portal for display only. */
export function sessionUser(name: string, role: "doctor" | "admin"): User {
  return {
    id: name,
    username: name,
    full_name: name,
    role,
    department: "",
    shift_status: "off_duty",
    is_active: true,
    created_at: new Date().toISOString(),
  };
}
