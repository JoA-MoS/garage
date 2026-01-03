import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ModalPortalProps {
  /**
   * Whether the modal is open. When false, returns null.
   */
  isOpen: boolean;
  /**
   * The modal content to render inside the backdrop.
   */
  children: ReactNode;
  /**
   * Optional callback when clicking the backdrop (outside the modal content).
   * If not provided, backdrop clicks do nothing.
   */
  onBackdropClick?: () => void;
}

/**
 * A reusable portal wrapper for modals that renders content to document.body.
 *
 * This solves the "containing block" issue where CSS transforms (like animations)
 * create a new containing block that affects `position: fixed` elements, causing
 * them to not reach the true viewport edges.
 *
 * By rendering to document.body via a portal, the modal escapes any containing
 * blocks in the component tree.
 *
 * @example
 * ```tsx
 * <ModalPortal isOpen={isOpen} onBackdropClick={onClose}>
 *   <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
 *     {/* Modal content *\/}
 *   </div>
 * </ModalPortal>
 * ```
 */
export function ModalPortal({
  isOpen,
  children,
  onBackdropClick,
}: ModalPortalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger if clicking the backdrop itself, not its children
    if (e.target === e.currentTarget && onBackdropClick) {
      onBackdropClick();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      {children}
    </div>,
    document.body,
  );
}
