export interface Patient {
  id: string;           // Firestore document ID
  patientId: string;    // Custom patient identifier
  name: string;         // Patient full name
  nameKana: string;     // Patient name in katakana
  birthdate: string;    // YYYY-MM-DD format
  lastVisitDate: string | null; // YYYY-MM-DD or null
  createdAt: any;       // Firestore Timestamp
}

export interface PatientFormData {
  patientId: string;
  name: string;
  nameKana: string;
  birthdate: string;
  lastVisitDate: string | null;
}