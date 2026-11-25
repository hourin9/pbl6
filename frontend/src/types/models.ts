export type PriorityLevel = "emergency" | "review" | "none";
export type ReviewStatus = "pending" | "confirmed" | "rejected";
export type ScanStatus = "pending" | "processing" | "done" | "failed";
export type UserRole = "doctor" | "admin" | "nurse";
export type ShiftStatus = "on_duty" | "off_duty";

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  department: string;
  shift_status: ShiftStatus;
  is_active: boolean;
  created_at: string;
}

export interface DetectionResult {
  id: string;
  scan_image_id: string;
  has_hemorrhage: boolean;
  hemorrhage_type: string;
  location: string;
  volume_mm3: number;
  confidence: number;
  priority_level: PriorityLevel;
  spread_prediction: string;
  heatmap_path: string;
  created_at: string;
  review_status: ReviewStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  doctor_note?: string;
}

export interface ScanImage {
  id: string;
  case_id: string;
  medical_record_id?: string;
  file_path: string;
  uploaded_by: string;
  uploaded_at: string;
  status: ScanStatus;
  result?: DetectionResult;
}

export interface Case {
  id: string;
  created_at: string;
  priority_level: PriorityLevel;
  review_status: ReviewStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  doctor_note?: string;
  scan_count: number;
  scans: ScanImage[];
  patient_name?: string;
  medical_record_id?: string;
}

export interface SystemConfig {
  confidence_threshold: number;
  emergency_threshold: number;
  auto_alert: boolean;
  fallback_on_no_duty: boolean;
}
