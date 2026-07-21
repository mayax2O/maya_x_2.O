import { Modal } from "../ui/Modal";

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "Ctrl/Cmd + K", description: "Open the command palette" },
  { keys: "?", description: "Show this shortcuts reference" },
  { keys: "Esc", description: "Close the open modal or drawer" },
];

export function ShortcutsHelp({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      title="Keyboard shortcuts"
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClassName="max-w-sm"
    >
      <ul className="flex flex-col gap-3">
        {SHORTCUTS.map((shortcut) => (
          <li
            key={shortcut.keys}
            className="flex items-center justify-between text-[13.5px] text-porcelain/80"
          >
            <span>{shortcut.description}</span>
            <kbd className="rounded border border-white/20 px-2 py-0.5 text-[12px] text-porcelain">
              {shortcut.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
