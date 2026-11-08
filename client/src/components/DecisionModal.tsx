import type { ReactNode } from 'react';
import { Modal } from '@mantine/core';

interface Props {
  opened: boolean;
  onClose: () => void;
  title: string;
  size?: number;
  children: ReactNode;
}

/**
 * The two decision dialogs (wrap up, sign with gaps), built from Mantine's
 * Modal parts. Mantine renders the modal header as a <header>, which inside
 * role="dialog" reads as a second page banner, so it's a <div> here.
 * Escape and the overlay both call onClose: the safe choice in each dialog.
 */
export function DecisionModal({ opened, onClose, title, size = 600, children }: Props) {
  return (
    <Modal.Root opened={opened} onClose={onClose} size={size} centered radius="xl" padding="xl">
      <Modal.Overlay color="#0e1d3a" backgroundOpacity={0.48} />
      <Modal.Content>
        <Modal.Header component="div">
          <Modal.Title className="wrapup-title">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{children}</Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
