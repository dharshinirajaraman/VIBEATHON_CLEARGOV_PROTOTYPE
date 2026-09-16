import type { UploadedDoc, AIIssue } from "./storage";
import type { DocumentRequirement } from "../data/schemes";

const ALLOWED_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  png: ["image/png"],
  jpg_png: ["image/jpeg", "image/png"],
  any: ["application/pdf", "image/jpeg", "image/png"],
};

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function checkType(doc: UploadedDoc, req: DocumentRequirement): string | null {
  const accepted = req.acceptedTypes ?? ["application/pdf", "image/jpeg", "image/png"];
  const ok = accepted.some((t) => doc.fileType.startsWith(t) || doc.fileType === t);
  if (!ok) {
    const friendlyTypes = accepted
      .map((t) => (t.includes("pdf") ? "PDF" : t.includes("jpeg") ? "JPG" : "PNG"))
      .join(", ");
    return `Invalid file type. ${req.label} must be uploaded as ${friendlyTypes}. Received: ${doc.fileType || "unknown"}.`;
  }
  return null;
}

function checkSize(doc: UploadedDoc, req: DocumentRequirement): string | null {
  const limitMB = req.maxSizeMB ?? 5;
  if (doc.fileSizeKB > limitMB * 1024) {
    return `File too large. ${req.label} must be under ${limitMB} MB. Uploaded file is ${(doc.fileSizeKB / 1024).toFixed(1)} MB.`;
  }
  return null;
}

function checkNameMatch(doc: UploadedDoc, req: DocumentRequirement): string | null {
  const name = normalise(doc.fileName);
  const genericNames = ["image", "img", "scan", "document", "file", "upload", "photo", "screenshot", "whatsappimage"];
  const aliases: Record<string, string[]> = {
    aadhar: ["aadhaar", "aadhar", "uid"], income: ["income", "salary", "earnings"], residence: ["residence", "address", "domicile"],
    marksheet: ["marks", "marklist", "score", "result"], bonafide: ["bonafide", "student"], bank: ["bank", "passbook", "statement"],
    photo: ["photo", "passport"], pan: ["pan"], caste: ["caste", "community"], age_proof: ["birth", "age", "dob"],
  };
  if (!name || genericNames.some(keyword => name.startsWith(keyword) && name.length < keyword.length + 8)) return null;
  const keywords = [
    normalise(req.id),
    ...req.label.split(" ").map(normalise).filter((w) => w.length > 3),
    ...(aliases[req.id] ?? []),
  ];
  // If the file name contains none of the document keywords, flag possible mismatch
  const matches = keywords.some((kw) => name.includes(kw));
  if (!matches && doc.fileName.length > 0) {
    return `Possible document mismatch. Expected ${req.label} but the uploaded file is named "${doc.fileName}". Verify that the correct document has been uploaded.`;
  }
  return null;
}

function checkEmpty(doc: UploadedDoc): string | null {
  if (!doc.dataUrl || doc.fileSizeKB === 0) {
    return "Empty file detected. The uploaded file appears to have no content. Please upload a valid document.";
  }
  return null;
}

export interface VerificationResult {
  pass: boolean;
  issues: AIIssue[];
}

export function verifyDocuments(
  uploaded: UploadedDoc[],
  requirements: DocumentRequirement[]
): VerificationResult {
  const issues: AIIssue[] = [];

  for (const req of requirements) {
    if (!req.required) continue;
    const doc = uploaded.find((u) => u.docId === req.id);

    if (!doc) {
      issues.push({
        docId: req.id,
        docLabel: req.label,
        code: "missing_document",
        message: `Required document missing: ${req.label} has not been uploaded.`,
      });
      continue;
    }

    const emptyErr = checkEmpty(doc);
    if (emptyErr) { issues.push({ docId: req.id, docLabel: req.label, code: "empty_file", message: emptyErr }); continue; }

    const typeErr = checkType(doc, req);
    if (typeErr) { issues.push({ docId: req.id, docLabel: req.label, code: "invalid_file_type", message: typeErr }); continue; }

    const sizeErr = checkSize(doc, req);
    if (sizeErr) { issues.push({ docId: req.id, docLabel: req.label, code: "file_too_large", message: sizeErr }); }

    const nameErr = checkNameMatch(doc, req);
    if (nameErr) { issues.push({ docId: req.id, docLabel: req.label, code: "name_mismatch", message: nameErr }); }
  }

  const duplicateFiles = uploaded.filter((doc, index, all) => all.findIndex(other => other.dataUrl === doc.dataUrl) !== index);
  duplicateFiles.forEach(doc => issues.push({ docId: doc.docId, docLabel: doc.label, code: "duplicate_file", message: `The same file appears to be used for more than one document. Upload a separate ${doc.label}.` }));

  return { pass: issues.length === 0, issues };
}
