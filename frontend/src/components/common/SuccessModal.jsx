import React, { useEffect } from "react";
import "./SuccessModal.css";

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  details,
  onConfirm,
  confirmText = "Continue",
  autoClose = 3000, // Auto close after 3 seconds (set to 0 to disable)
}) {
  useEffect(() => {
    if (isOpen && autoClose > 0) {
      const timer = setTimeout(() => {
        onClose();
        if (onConfirm) onConfirm();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="success-modal-overlay" onClick={onClose}>
      <div
        className="success-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="success-animation">
          <div className="success-checkmark">
            <div className="check-icon">
              <span className="icon-line line-tip"></span>
              <span className="icon-line line-long"></span>
              <div className="icon-circle"></div>
              <div className="icon-fix"></div>
            </div>
          </div>
        </div>

        <div className="success-modal-header">
          <h2>{title}</h2>
        </div>

        <div className="success-modal-body">
          <p>{message}</p>
          {details && (
            <div className="success-details">
              {details.map((detail, idx) => (
                <div key={idx} className="detail-item">
                  <span className="detail-label">{detail.label}:</span>
                  <span className="detail-value">{detail.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="success-modal-footer">
          <button
            className="success-confirm-btn"
            onClick={() => {
              onClose();
              if (onConfirm) onConfirm();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
