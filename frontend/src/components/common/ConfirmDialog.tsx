import React from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  showReasonInput?: boolean;
  reasonValue?: string;
  onReasonChange?: (value: string) => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  showReasonInput = false,
  reasonValue = '',
  onReasonChange,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'btn-primary'
}) => {
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <h3>{title}</h3>
        <p>{message}</p>
        
        {showReasonInput && onReasonChange && (
          <div className="form-group">
            <label>Reason (optional):</label>
            <textarea
              value={reasonValue}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={3}
            />
          </div>
        )}
        
        <div className="dialog-actions">
          <button className={`btn ${confirmButtonClass}`} onClick={onConfirm}>
            {confirmText}
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;