import React from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  description,
  confirmText = "Confirm",
  onConfirm,
  loading,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close dialog"
          disabled={loading}
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-2">{title}</h2>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}; 