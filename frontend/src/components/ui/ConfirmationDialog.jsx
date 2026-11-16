import Button from "./Button.jsx";
import Modal from "./Modal.jsx";

export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  destructive = false,
  loading = false,
}) {
  return (
    <Modal
      description={description}
      footer={(
        <>
          <Button disabled={loading} onClick={onClose} variant="secondary">{cancelText}</Button>
          <Button loading={loading} onClick={onConfirm} variant={destructive ? "danger" : "primary"}>
            {confirmText}
          </Button>
        </>
      )}
      onClose={onClose}
      open={open}
      title={title}
    />
  );
}
