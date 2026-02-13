import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EpaperImage } from "../../api/epaper.api";

interface SortableItemProps {
  id: string;
  image: EpaperImage;
  onReplace: () => void;
  onRemove: () => void;
  isReplacing: boolean;
}

export function SortableItem({
  id,
  image,
  onReplace,
  onRemove,
  isReplacing,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${
        isReplacing ? "border-blue-500 border-2" : ""
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>

        <div className="w-16 h-16 flex-shrink-0">
          <img
            src={`${API_URL}${image.imageUrl}`}
            alt={image.originalName}
            className="w-full h-full object-cover rounded"
          />
        </div>

        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {image.originalName}
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Page {image.pageNumber}</span>
            <span>•</span>
            <span>{(image.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onReplace}
          className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm font-medium"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 px-3 py-1 text-sm font-medium"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
