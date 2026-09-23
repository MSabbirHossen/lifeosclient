import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Helper to get active theme color tokens dynamically
 */
export const getThemeColors = () => {
  const root = document.documentElement;
  const isDark =
    root.getAttribute('data-theme') === 'dark' ||
    (!root.getAttribute('data-theme') &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return {
    isDark,
    background: isDark ? '#18181B' : '#FFFFFF',
    color: isDark ? '#F8FAFC' : '#0F172A',
    borderColor: isDark ? '#27272A' : '#E2E8F0',
    mutedColor: isDark ? '#94A3B8' : '#64748B',
    confirmBg: isDark ? '#6366F1' : '#4F46E5',
    dangerBg: isDark ? '#EF4444' : '#DC2626',
    cancelBg: isDark ? '#27272A' : '#F1F5F9',
    cancelColor: isDark ? '#E2E8F0' : '#475569',
  };
};

/**
 * Base Modal Alert Options for Centered Dialogs
 */
const getSwalBaseOptions = () => {
  const theme = getThemeColors();
  return {
    background: theme.background,
    color: theme.color,
    backdrop: `rgba(0, 0, 0, ${theme.isDark ? 0.75 : 0.45})`,
    customClass: {
      popup: 'lifeos-swal-popup',
      title: 'lifeos-swal-title',
      htmlContainer: 'lifeos-swal-text',
      confirmButton: 'lifeos-swal-confirm-btn',
      cancelButton: 'lifeos-swal-cancel-btn',
      denyButton: 'lifeos-swal-deny-btn',
      actions: 'lifeos-swal-actions',
    },
    buttonsStyling: false,
  };
};

/**
 * Quick Toast Helpers for CUED Operations (Auto-dismisses smoothly after 3s or on click)
 */
export const showSuccessToast = (message = 'Operation completed successfully', title = '') => {
  const theme = getThemeColors();
  return Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: theme.background,
    color: theme.color,
    icon: 'success',
    title: title || message,
    text: title ? message : undefined,
    customClass: {
      popup: 'lifeos-swal-toast lifeos-swal-toast-success',
      title: 'lifeos-swal-toast-title',
      htmlContainer: 'lifeos-swal-toast-text',
    },
    didOpen: (toast) => {
      toast.style.cursor = 'pointer';
      toast.onclick = () => Swal.close();
    },
  });
};

export const showErrorToast = (message = 'Something went wrong', title = '') => {
  const theme = getThemeColors();
  return Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    background: theme.background,
    color: theme.color,
    icon: 'error',
    title: title || message,
    text: title ? message : undefined,
    customClass: {
      popup: 'lifeos-swal-toast lifeos-swal-toast-error',
      title: 'lifeos-swal-toast-title',
      htmlContainer: 'lifeos-swal-toast-text',
    },
    didOpen: (toast) => {
      toast.style.cursor = 'pointer';
      toast.onclick = () => Swal.close();
    },
  });
};

export const showInfoToast = (message, title = '') => {
  const theme = getThemeColors();
  return Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: theme.background,
    color: theme.color,
    icon: 'info',
    title: title || message,
    text: title ? message : undefined,
    customClass: {
      popup: 'lifeos-swal-toast lifeos-swal-toast-info',
      title: 'lifeos-swal-toast-title',
      htmlContainer: 'lifeos-swal-toast-text',
    },
    didOpen: (toast) => {
      toast.style.cursor = 'pointer';
      toast.onclick = () => Swal.close();
    },
  });
};

export const showWarningToast = (message, title = '') => {
  const theme = getThemeColors();
  return Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    background: theme.background,
    color: theme.color,
    icon: 'warning',
    title: title || message,
    text: title ? message : undefined,
    customClass: {
      popup: 'lifeos-swal-toast lifeos-swal-toast-warning',
      title: 'lifeos-swal-toast-title',
      htmlContainer: 'lifeos-swal-toast-text',
    },
    didOpen: (toast) => {
      toast.style.cursor = 'pointer';
      toast.onclick = () => Swal.close();
    },
  });
};

/**
 * Full SweetAlert Dialog Helpers
 */
export const showSuccessAlert = (title, text, customOptions = {}) => {
  return Swal.fire({
    ...getSwalBaseOptions(),
    icon: 'success',
    title,
    text,
    confirmButtonText: 'OK',
    timer: customOptions.autoClose ? 2500 : undefined,
    timerProgressBar: !!customOptions.autoClose,
    ...customOptions,
  });
};

export const showErrorAlert = (title = 'Error', text = 'Operation failed. Please try again.', customOptions = {}) => {
  return Swal.fire({
    ...getSwalBaseOptions(),
    icon: 'error',
    title,
    text,
    confirmButtonText: 'Dismiss',
    ...customOptions,
  });
};

export const showInfoAlert = (title, text, customOptions = {}) => {
  return Swal.fire({
    ...getSwalBaseOptions(),
    icon: 'info',
    title,
    text,
    confirmButtonText: 'OK',
    ...customOptions,
  });
};

/**
 * Confirmation Dialog for Critical CUED Operations (Delete, Overwrite, Reset, etc.)
 * Returns a Promise that resolves to true if confirmed, false otherwise.
 */
export const showConfirmDialog = async ({
  title = 'Are you sure?',
  text = 'This action cannot be undone.',
  confirmButtonText = 'Yes, Proceed',
  cancelButtonText = 'Cancel',
  icon = 'warning',
  isDanger = true,
  customOptions = {},
} = {}) => {
  const base = getSwalBaseOptions();
  const result = await Swal.fire({
    ...base,
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      ...base.customClass,
      confirmButton: isDanger
        ? 'lifeos-swal-confirm-btn lifeos-swal-danger-btn'
        : 'lifeos-swal-confirm-btn',
    },
    ...customOptions,
  });

  return result.isConfirmed;
};

/**
 * Convenience helper specifically for Delete confirmation
 */
export const confirmDelete = async (itemName = 'this item', customMessage = '') => {
  return showConfirmDialog({
    title: `Delete ${itemName}?`,
    text: customMessage || `Are you sure you want to permanently delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    icon: 'warning',
    isDanger: true,
  });
};

/**
 * High-level CUED notifications
 */
export const notifyCreated = (itemName = 'Record', message = '') => {
  return showSuccessToast(message || `${itemName} has been created successfully!`);
};

export const notifyUpdated = (itemName = 'Record', message = '') => {
  return showSuccessToast(message || `${itemName} has been updated successfully!`);
};

export const notifyDeleted = (itemName = 'Record', message = '') => {
  return showSuccessToast(message || `${itemName} has been deleted.`);
};

export const notifyError = (error, fallbackMessage = 'An unexpected error occurred.') => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage;
  return showErrorToast(message);
};

export default {
  Swal,
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast,
  showSuccessAlert,
  showErrorAlert,
  showInfoAlert,
  showConfirmDialog,
  confirmDelete,
  notifyCreated,
  notifyUpdated,
  notifyDeleted,
  notifyError,
};
