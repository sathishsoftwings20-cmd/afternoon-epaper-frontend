/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "../api/api";
import axios from "axios";
import type { UserBase } from "./user.api";

// ---------- Keep your existing interfaces exactly as they are ----------
export interface EpaperImage {
  _id?: string;
  pageNumber: number;
  imageUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt?: string;
}

export interface EpaperPDF {
  fileUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt?: string;
}

export interface Epaper {
  _id?: string;
  name: string;
  date: string;
  images: EpaperImage[];
  pdf: EpaperPDF | null;
  fileType: "images" | "pdf";
  totalPages: number;
  status: "draft" | "published" | "archived";
  createdAt?: string;
  updatedAt?: string;
  createdBy?: Pick<UserBase, "_id" | "fullName" | "email" | "role">;
  updatedBy?: Pick<UserBase, "_id" | "fullName" | "email" | "role">;
}

export interface CreateEpaperPayload {
  name: string;
  date: string;
  status: "draft" | "published" | "archived";
  fileType?: "images" | "pdf";
  images?: File[];
  pdf?: File;
}

export interface UpdateEpaperPayload {
  name?: string;
  date?: string;
  status?: string;
  fileType?: "images" | "pdf";
  images?: File[];
  pdf?: File;
  removePDF?: boolean;
  replaceImageId?: string;
}

export interface ReorderImagesPayload {
  imageOrder: string[];
}

export interface EpaperResponse {
  message: string;
  epaper: Epaper;
}

export interface PaginatedResponse {
  epapers: Epaper[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ---------- Error helper (unchanged) ----------
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const message = data["message"];
      const error = data["error"];
      if (typeof message === "string") return message;
      if (typeof error === "string") return error;
    }
    return err.message || "Request failed";
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error occurred";
}

// ====================== TRANSFORMATION HELPERS ======================

/**
 * Convert a raw backend image (with `id`, `pageNumber`, etc.)
 * into the frontend EpaperImage type (with `_id` as string).
 */
function transformImage(backendImage: any): EpaperImage {
  return {
    _id: String(backendImage.id), // convert numeric id to string
    pageNumber: backendImage.pageNumber,
    imageUrl: backendImage.imageUrl,
    originalName: backendImage.originalName,
    mimeType: backendImage.mimeType,
    size: backendImage.size,
    uploadedAt: backendImage.uploadedAt,
  };
}

/**
 * Convert a raw backend epaper object into the frontend Epaper type.
 */
function transformEpaper(backendEpaper: any): Epaper {
  if (!backendEpaper) throw new Error("No epaper data");

  // 1. Copy basic fields
  const transformed: any = {
    _id: String(backendEpaper.id), // MongoDB‑compatible string id
    name: backendEpaper.name,
    date: backendEpaper.date, // already YYYY-MM-DD from backend

    totalPages: backendEpaper.totalPages || 0,
    status: backendEpaper.status || "draft",
    createdAt: backendEpaper.createdAt,
    updatedAt: backendEpaper.updatedAt,
  };

  // 2. Transform images (backend sends "Images" array)
  if (Array.isArray(backendEpaper.Images)) {
    transformed.images = backendEpaper.Images.map(transformImage);
  } else {
    transformed.images = [];
  }

  // 3. Build PDF object from flat fields
  if (backendEpaper.pdf_fileUrl) {
    transformed.pdf = {
      fileUrl: backendEpaper.pdf_fileUrl,
      originalName: backendEpaper.pdf_originalName,
      mimeType: backendEpaper.pdf_mimeType,
      size: backendEpaper.pdf_size,
      uploadedAt: backendEpaper.pdf_uploadedAt,
    };
  } else {
    transformed.pdf = null;
  }

  // 4. Remove the flat PDF fields (they are now in the pdf object)
  delete transformed.pdf_fileUrl;
  delete transformed.pdf_originalName;
  delete transformed.pdf_mimeType;
  delete transformed.pdf_size;
  delete transformed.pdf_uploadedAt;

  // 5. User associations – your backend currently does NOT include them.
  //    Set to null; your components fall back to "System".
  transformed.createdBy = null;
  transformed.updatedBy = null;

  // 6. fileType is not stored in backend; derive from presence of pdf/images.
  //    Your components recalculate it anyway, but we provide a sensible default.
  transformed.fileType = transformed.pdf ? "pdf" : "images";

  return transformed as Epaper;
}

/**
 * Convert the paginated response from backend (which sends { total, page, totalPages, data })
 * into the frontend PaginatedResponse shape.
 */
function transformPaginatedResponse(
  backendData: any,
  requestedLimit: number,
): PaginatedResponse {
  const epapers = Array.isArray(backendData.data)
    ? backendData.data.map(transformEpaper)
    : [];

  return {
    epapers,
    pagination: {
      page: backendData.page || 1,
      limit: requestedLimit,
      total: backendData.total || 0,
      pages: backendData.totalPages || 0,
    },
  };
}

// ====================== API CALLS ======================

// ---------- CREATE ----------
export async function createEpaper(
  payload: CreateEpaperPayload,
): Promise<EpaperResponse> {
  try {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("date", payload.date);
    formData.append("fileType", payload.fileType || "images");
    if (payload.status) formData.append("status", payload.status);
    if (payload.images?.length) {
      payload.images.forEach((image) => formData.append("images", image));
    }
    if (payload.pdf) {
      formData.append("pdf", payload.pdf);
    }

    const res = await api.post("/epapers", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Backend returns the raw epaper object, not wrapped.
    // We wrap it to match the frontend's EpaperResponse.
    return {
      message: "ePaper created successfully",
      epaper: transformEpaper(res.data),
    };
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// ---------- GET ALL (with pagination) ----------
export async function getAllEpapers(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  status?: string,
  startDate?: string,
  endDate?: string,
): Promise<PaginatedResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const res = await api.get(`/epapers?${params}`);
    // Backend sends: { total, page, totalPages, data: [...] }
    return transformPaginatedResponse(res.data, limit);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// ---------- GET BY ID ----------
export async function getEpaperById(id: string): Promise<Epaper> {
  try {
    const res = await api.get(`/epapers/${id}`);
    return transformEpaper(res.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// ---------- UPDATE ----------
export async function updateEpaper(
  id: string,
  payload: UpdateEpaperPayload,
): Promise<EpaperResponse> {
  try {
    const formData = new FormData();
    if (payload.name) formData.append("name", payload.name);
    if (payload.date) formData.append("date", payload.date);
    if (payload.status) formData.append("status", payload.status);
    if (payload.fileType) formData.append("fileType", payload.fileType);
    if (payload.images?.length) {
      payload.images.forEach((image) => formData.append("images", image));
    }
    if (payload.pdf) formData.append("pdf", payload.pdf);
    if (payload.removePDF) formData.append("removePDF", "true");
    if (payload.replaceImageId)
      formData.append("replaceImageId", payload.replaceImageId);

    const res = await api.put(`/epapers/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Backend returns raw updated epaper – wrap it.
    return {
      message: "ePaper updated successfully",
      epaper: transformEpaper(res.data),
    };
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// ---------- REORDER IMAGES ----------
export async function reorderEpaperImages(
  id: string,
  imageOrder: string[],
): Promise<{ message: string; images: EpaperImage[] }> {
  try {
    const res = await api.patch(`/epapers/${id}/reorder`, { imageOrder });
    // Backend returns { message: "..." } – no images array.
    // The frontend component does not use the returned images, so we can simply return the message.
    return {
      message: res.data.message || "Images reordered successfully",
      images: [], // not used, but satisfies the type
    };
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// ---------- DELETE EPAPER ----------
export async function deleteEpaper(id: string): Promise<{ message: string }> {
  try {
    const res = await api.delete(`/epapers/${id}`);
    return res.data; // already { message: "..." }
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// ---------- DELETE SINGLE IMAGE ----------
export async function deleteEpaperImage(
  epaperId: string,
  imageId: string,
): Promise<{ message: string }> {
  try {
    const res = await api.delete(`/epapers/${epaperId}/images/${imageId}`);
    return res.data; // { message: "..." }
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// ---------- GET BY DATE RANGE ----------
export async function getEpapersByDateRange(
  startDate: string,
  endDate: string,
): Promise<Epaper[]> {
  try {
    const res = await api.get("/epapers/date-range", {
      params: { startDate, endDate },
    });
    // Backend returns an array of raw epaper objects.
    return (Array.isArray(res.data) ? res.data : []).map(transformEpaper);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// ---------- GET BY DATE (PUBLIC) ----------
export async function getEpaperByDate(date: string): Promise<Epaper> {
  try {
    const res = await api.get("/epapers/by-date", {
      params: { date },
    });
    return transformEpaper(res.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}
// ---------- GET LATEST EPAPER DATE ----------
export async function getLatestEpaperDate(): Promise<string> {
  try {
    const res = await api.get("/epapers/latest-date");
    // Expected response: { date: "YYYY-MM-DD" }
    return res.data.date;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// Don't forget to add it to the default export at the bottom
export default {
  createEpaper,
  getAllEpapers,
  getEpaperById,
  getEpaperByDate,
  getLatestEpaperDate, // <-- add here
  updateEpaper,
  reorderEpaperImages,
  deleteEpaper,
  deleteEpaperImage,
  getEpapersByDateRange,
};
