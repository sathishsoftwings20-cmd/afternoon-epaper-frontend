import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { format } from "date-fns";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { SortableNewImage } from "./SortableNewImage"; // new component (see below)
import {
  createEpaper,
  getEpaperById,
  updateEpaper,
  reorderEpaperImages,
  deleteEpaperImage,
  type EpaperImage,
  type EpaperPDF,
} from "../../api/epaper.api";
import Label from "../ui/form/Label";
import Input from "../ui/form/InputField";
import Button from "../ui/button/Button";
import Select from "../ui/form/Select";
import DatePicker from "../ui/form/date-picker";
import { Newspaper, Pencil } from "lucide-react";

interface NewImageItem {
  id: string;
  file: File;
  preview: string;
}

interface EpaperFormData {
  name: string;
  date: Date | null;
  status: "draft" | "published" | "archived";
  newImages: NewImageItem[]; // ✅ unified new images
  existingImages: EpaperImage[];
  pdf: File | null;
  existingPDF: EpaperPDF | null;
}

export default function EpaperForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const imagesInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<EpaperFormData>({
    name: "",
    date: new Date(),
    status: "draft",
    newImages: [], // ✅ initial empty
    existingImages: [],
    pdf: null,
    existingPDF: null,
  });

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    date?: string;
    files?: string;
  }>({});
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      formData.newImages.forEach((img) => URL.revokeObjectURL(img.preview));
      if (pdfPreview) URL.revokeObjectURL(pdfPreview);
    };
  }, [formData.newImages, pdfPreview]);

  // Load ePaper for editing
  useEffect(() => {
    if (!id) return;
    const loadEpaper = async () => {
      try {
        const data = await getEpaperById(id);
        setFormData({
          name: data.name,
          date: new Date(data.date),
          status: data.status,
          newImages: [],
          existingImages: data.images || [],
          pdf: null,
          existingPDF: data.pdf || null,
        });
      } catch (error) {
        console.error("Failed to load ePaper", error);
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load ePaper",
        });
      }
    };
    loadEpaper();
  }, [id, showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, date }));
    if (errors.date) {
      setErrors((prev) => ({ ...prev, date: undefined }));
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value as "draft" | "published" | "archived",
    }));
  };

  // ---------- NEW IMAGES (with DnD) ----------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (validFiles.length !== files.length) {
      showToast({
        variant: "error",
        title: "Invalid Files",
        message: "Only image files are allowed",
      });
    }

    const newItems: NewImageItem[] = validFiles.map((file) => ({
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `temp-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setFormData((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...newItems],
    }));

    if (imagesInputRef.current) {
      imagesInputRef.current.value = "";
    }
  };

  const removeNewImage = (id: string) => {
    setFormData((prev) => {
      const item = prev.newImages.find((img) => img.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return {
        ...prev,
        newImages: prev.newImages.filter((img) => img.id !== id),
      };
    });
  };

  const handleNewImageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = formData.newImages.findIndex(
        (img) => img.id === active.id,
      );
      const newIndex = formData.newImages.findIndex(
        (img) => img.id === over.id,
      );
      setFormData((prev) => ({
        ...prev,
        newImages: arrayMove(prev.newImages, oldIndex, newIndex),
      }));
    }
  };

  // ---------- PDF ----------
  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      showToast({
        variant: "error",
        title: "Invalid File",
        message: "Only PDF files are allowed",
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      pdf: file,
      existingPDF: null,
    }));

    const previewUrl = URL.createObjectURL(file);
    setPdfPreview(previewUrl);

    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  const removePDF = () => {
    setFormData((prev) => ({
      ...prev,
      pdf: null,
      existingPDF: null,
    }));
    if (pdfPreview) {
      URL.revokeObjectURL(pdfPreview);
      setPdfPreview(null);
    }
  };

  // ---------- EXISTING IMAGES (DnD) ----------
  const removeExistingImage = async (imageId: string | undefined) => {
    if (!imageId || !id) return;
    try {
      await deleteEpaperImage(id, imageId);
      setFormData((prev) => ({
        ...prev,
        existingImages: prev.existingImages.filter(
          (img) => img._id !== imageId,
        ),
      }));
      showToast({
        variant: "success",
        title: "Success",
        message: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete image", error);
      showToast({
        variant: "error",
        title: "Error",
        message: "Failed to delete image",
      });
    }
  };

  const replaceImage = (imageId: string) => {
    setReplacingImageId(imageId);
    imagesInputRef.current?.click();
  };

  const handleExistingImageDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = formData.existingImages.findIndex(
        (img) => img._id === active.id,
      );
      const newIndex = formData.existingImages.findIndex(
        (img) => img._id === over.id,
      );

      const reorderedImages = arrayMove(
        formData.existingImages,
        oldIndex,
        newIndex,
      );

      const updatedImages = reorderedImages.map((img, index) => ({
        ...img,
        pageNumber: index + 1,
      }));

      setFormData((prev) => ({
        ...prev,
        existingImages: updatedImages,
      }));

      if (id) {
        try {
          await reorderEpaperImages(
            id,
            updatedImages.map((img) => img._id!).filter(Boolean),
          );
          showToast({
            variant: "success",
            title: "Success",
            message: "Images reordered successfully",
          });
        } catch (error) {
          console.error("Failed to reorder images", error);
          showToast({
            variant: "error",
            title: "Error",
            message: "Failed to reorder images",
          });
        }
      }
    }
  };

  // ---------- VALIDATION ----------
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.date) newErrors.date = "Date is required";

    if (!id) {
      if (
        formData.newImages.length === 0 &&
        !formData.pdf &&
        formData.existingImages.length === 0 &&
        !formData.existingPDF
      ) {
        newErrors.files = "At least one image or PDF is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- SUBMIT ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      if (id) {
        // UPDATE
        await updateEpaper(id, {
          name: formData.name,
          date: formData.date ? format(formData.date, "yyyy-MM-dd") : undefined,
          status: formData.status,
          images: replacingImageId
            ? formData.newImages.map((item) => item.file)
            : formData.newImages.length > 0
              ? formData.newImages.map((item) => item.file)
              : undefined,
          pdf: formData.pdf || undefined,
          replaceImageId: replacingImageId || undefined,
          removePDF: formData.existingPDF === null && !formData.pdf,
        });
        showToast({
          variant: "success",
          title: "Updated",
          message: "ePaper updated successfully",
        });
      } else {
        // CREATE – ✅ send status
        await createEpaper({
          name: formData.name,
          date: format(formData.date!, "yyyy-MM-dd"),
          status: formData.status, // ✅ now sent
          images:
            formData.newImages.length > 0
              ? formData.newImages.map((item) => item.file)
              : undefined,
          pdf: formData.pdf || undefined,
        });
        showToast({
          variant: "success",
          title: "Created",
          message: "ePaper created successfully",
        });
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => navigate("/admin-dashboard/epapers"), 1000);
    } catch (error) {
      console.error("Error saving ePaper:", error);
      let msg = "Error saving ePaper";

      if (error instanceof Error) {
        msg = error.message;
      }

      if (msg.includes("already exists for this date")) {
        showToast({
          variant: "error",
          title: "Date Already Used",
          message: msg,
        });
      } else {
        showToast({
          variant: "error",
          title: "Error",
          message: msg,
        });
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setReplacingImageId(null);
    }
  };

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
  ];

  const isEditing = Boolean(id);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-100">
            {isEditing ? (
              <Pencil className="w-6 h-6 text-blue-600" />
            ) : (
              <Newspaper className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Edit ePaper" : "Upload New ePaper"}
          </h2>
        </div>
        <p className="text-gray-600">
          {isEditing
            ? "Update ePaper details, replace images, or reorder pages."
            : "Create a new ePaper edition with images and an optional PDF."}
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Name */}
            <div className="md:col-span-2">
              <Label htmlFor="name">
                Newspaper Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!errors.name}
                placeholder="AFTERNOON 01.01.2026"
                disabled={loading}
              />
              {errors.name && (
                <div className="text-sm text-red-600 mt-1">{errors.name}</div>
              )}
            </div>

            {/* Date */}
            <div>
              <DatePicker
                id="date"
                label={
                  <>
                    Publication Date <span className="text-red-500">*</span>
                  </>
                }
                value={formData.date}
                onChange={handleDateChange}
                placeholder="Select date"
              />
              <p className="text-xs text-gray-500 mt-1">
                Only one ePaper is allowed per day
              </p>
              {errors.date && (
                <div className="text-sm text-red-600 mt-1">{errors.date}</div>
              )}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                options={statusOptions}
                value={formData.status}
                onChange={handleStatusChange}
                placeholder="Select status"
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
                disabled={loading}
              />
            </div>

            {/* PDF Upload */}
            <div className="md:col-span-2">
              <Label htmlFor="pdf-upload">PDF File</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                <input
                  type="file"
                  ref={pdfInputRef}
                  onChange={handlePDFUpload}
                  accept=".pdf"
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <div className="w-12 h-12 mb-4 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      Click to upload PDF
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF up to 100MB
                  </p>
                </label>
              </div>

              {/* PDF Preview */}
              {(formData.existingPDF || pdfPreview) && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-purple-600 dark:text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formData.existingPDF?.originalName ||
                            formData.pdf?.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formData.existingPDF?.size
                            ? `${(
                                formData.existingPDF.size /
                                1024 /
                                1024
                              ).toFixed(2)} MB`
                            : formData.pdf?.size
                              ? `${(formData.pdf.size / 1024 / 1024).toFixed(2)} MB`
                              : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={removePDF}
                      className="text-red-600 hover:text-red-800 bg-transparent"
                      variant="outline"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* IMAGE UPLOAD SECTION */}
            <div className="md:col-span-2">
              <Label htmlFor="image-upload">Upload Images</Label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center mb-4">
                <input
                  type="file"
                  ref={imagesInputRef}
                  onChange={handleImageUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <div className="w-12 h-12 mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      Click to upload images
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG up to 10MB each (max 50 files)
                  </p>
                </label>
              </div>

              {errors.files && (
                <div className="text-sm text-red-600 mt-1">{errors.files}</div>
              )}

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* ✅ NEW IMAGES – with Drag & Drop (always visible) */}
              {formData.newImages.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      New Images ({formData.newImages.length})
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Drag to reorder
                    </span>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleNewImageDragEnd}
                  >
                    <SortableContext
                      items={formData.newImages.map((img) => img.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.newImages.map((img, index) => (
                          <SortableNewImage
                            key={img.id}
                            id={img.id}
                            preview={img.preview}
                            pageNumber={
                              formData.existingImages.length + index + 1
                            }
                            onRemove={() => removeNewImage(img.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* Existing Images with Drag & Drop (edit mode only) */}
              {formData.existingImages.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Existing Images ({formData.existingImages.length})
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Drag to reorder
                    </span>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleExistingImageDragEnd}
                  >
                    <SortableContext
                      items={formData.existingImages.map((img) => img._id!)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {formData.existingImages.map((image) => (
                          <SortableItem
                            key={image._id}
                            id={image._id!}
                            image={image}
                            onReplace={() => replaceImage(image._id!)}
                            onRemove={() => removeExistingImage(image._id)}
                            isReplacing={replacingImageId === image._id}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="md:col-span-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving...
                    </span>
                  ) : isEditing ? (
                    "Update ePaper"
                  ) : (
                    "Upload ePaper"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
