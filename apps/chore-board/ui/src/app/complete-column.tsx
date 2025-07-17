import { useDroppable } from '@dnd-kit/core';

export function CompleteColumn() {
  const { setNodeRef } = useDroppable({
    id: 'complete',
  });

  return (
    <div ref={setNodeRef} className="grid-in-finnish bg-checkered w-12"></div>
  );
}
