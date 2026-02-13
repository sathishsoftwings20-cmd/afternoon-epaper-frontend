import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { getEpaperByDate, Epaper } from "../../api/epaper.api";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Maximize,
  Minimize,
} from "lucide-react";

export default function PublicLandingPage() {
  const navigate = useNavigate();
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [epaper, setEpaper] = useState<Epaper | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [navAttempted, setNavAttempted] = useState(false); // prevent duplicate 404 navigation

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ---------- Date picker ----------
  function openDatePicker() {
    if (dateInputRef.current?.showPicker) {
      dateInputRef.current.showPicker();
    } else {
      dateInputRef.current?.click();
    }
  }

  // ---------- PDF download ----------
  async function handlePDFDownload() {
    if (!epaper?.pdf?.fileUrl) {
      alert("No PDF available for this edition");
      return;
    }

    try {
      const pdfUrl = `${API_URL}${epaper.pdf.fileUrl}`;
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Failed to download PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download =
        epaper.pdf.originalName ||
        `newspaper-${format(selectedDate, "yyyy-MM-dd")}.pdf`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF Download Error:", err);
      alert("Unable to download PDF");
    }
  }

  // ---------- Fullscreen toggle ----------
  function toggleFullscreen() {
    if (!viewerRef.current) return;

    if (!document.fullscreenElement) {
      viewerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  // ---------- Load ePaper by selected date ONLY – no fallback ----------
  async function loadEpaper(date: Date) {
    setLoading(true);
    setNavAttempted(false); // reset on each new attempt

    const formattedDate = format(date, "yyyy-MM-dd");

    try {
      const data = await getEpaperByDate(formattedDate);
      // Success – ePaper found
      setEpaper(data);
      setCurrentPage(0);
    } catch (err) {
      // No ePaper for this date → redirect to 404 (unless already there)
      console.info("No ePaper for date:", formattedDate, err);
      setEpaper(null);

      if (!navAttempted && window.location.pathname !== "/404") {
        setNavAttempted(true);
        navigate("/404", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  // ---------- Scroll to top when page changes ----------
  useEffect(() => {
    if (pageRef.current) {
      pageRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  // ---------- Reload when selectedDate changes ----------
  useEffect(() => {
    loadEpaper(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // ---------- Fullscreen change listener ----------
  useEffect(() => {
    function handleExit() {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    }

    document.addEventListener("fullscreenchange", handleExit);
    return () => document.removeEventListener("fullscreenchange", handleExit);
  }, []);

  // ---------- Render states ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ePaper...</p>
        </div>
      </div>
    );
  }

  // If no ePaper after loading, we are already navigating to 404,
  // but as a safety we render nothing.
  if (!epaper) {
    return null;
  }

  const totalPages = epaper.images?.length || 0;

  return (
    <div className="min-h-screen bg-white">
      {/* ================= HEADER ================= */}
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-600 hidden sm:block">
            {format(selectedDate, "EEE, MMM d, yyyy")}
          </div>

          <div className="flex justify-center flex-1">
            <img
              src="/images/logo/afternoon-epaper-logo.png"
              alt="Afternoon Logo"
              className="h-9 sm:h-10"
            />
          </div>

          <div className="w-24 hidden sm:block" />
        </div>
      </header>

      {/* ================= ACTION BAR ================= */}
      <div className="w-full bg-gradient-to-b from-red-700 to-red-900">
        <div className="max-w-[1400px] mx-auto px-2 py-2 flex items-center gap-2 overflow-x-auto">
          <div className="flex gap-3 text-white">
            {/* Date picker trigger */}
            <Calendar
              className="w-5 h-5 cursor-pointer"
              onClick={openDatePicker}
            />
            <input
              ref={dateInputRef}
              type="date"
              className="hidden"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(new Date(e.target.value));
                }
              }}
            />

            {/* Download PDF */}
            <Download
              className="w-5 h-5 cursor-pointer"
              onClick={handlePDFDownload}
            />

            {/* Fullscreen toggle */}
            {isFullscreen ? (
              <Minimize
                className="w-5 h-5 cursor-pointer"
                onClick={toggleFullscreen}
              />
            ) : (
              <Maximize
                className="w-5 h-5 cursor-pointer"
                onClick={toggleFullscreen}
              />
            )}
          </div>

          {/* Page number quick navigation */}
          <div className="ml-auto flex gap-1">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                className={`px-2 py-1 text-sm rounded ${
                  currentPage === idx
                    ? "bg-white text-red-800"
                    : "bg-red-700 text-white"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================= MAIN VIEWER ================= */}
      <main
        ref={viewerRef}
        className="max-w-[1300px] mx-auto bg-white shadow flex mt-4 h-[calc(100vh-140px)] relative"
      >
        {/* Previous page button (absolute) */}
        {currentPage > 0 && (
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2
               p-2 bg-white/80 rounded-full shadow hover:bg-white z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Thumbnail sidebar */}
        <aside className="hidden sm:block w-28 overflow-y-auto border-r bg-white p-2">
          {epaper.images?.map((img, idx) => (
            <button
              key={img._id || idx}
              onClick={() => setCurrentPage(idx)}
              className={`mb-2 border-2 rounded overflow-hidden ${
                currentPage === idx ? "border-blue-500" : "border-gray-300"
              }`}
            >
              <img
                src={`${API_URL}${img.imageUrl}`}
                alt={`Page ${img.pageNumber}`}
                className="w-full h-24 object-cover"
              />
              <div className="text-xs text-center bg-black text-white">
                {img.pageNumber}
              </div>
            </button>
          ))}
        </aside>

        {/* Main page display */}
        <section ref={pageRef} className="flex-1 bg-white overflow-y-auto">
          {totalPages > 0 ? (
            <img
              src={`${API_URL}${epaper.images[currentPage].imageUrl}`}
              alt={`Page ${epaper.images[currentPage].pageNumber}`}
              className="w-full h-auto"
            />
          ) : (
            <div className="p-6 text-center">No pages available</div>
          )}
        </section>

        {/* Next page button (absolute) */}
        {currentPage < totalPages - 1 && (
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
            }
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2
               p-2 bg-white/80 rounded-full shadow hover:bg-white z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </main>
    </div>
  );
}
