import { useDroppable } from '@dnd-kit/core';

export function CompleteColumn() {
  const { isOver, setNodeRef } = useDroppable({
    id: 'complete',
  });
  const style = {
    color: isOver ? 'blue' : undefined,
  };

  return (
    <div ref={setNodeRef} className="grid-in-finnish bg-checkered w-12"></div>
  );
}
