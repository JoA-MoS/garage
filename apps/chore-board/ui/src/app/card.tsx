import { useDraggable } from '@dnd-kit/core';

export interface CardProps {
  id: number | string;
  title: string;
  assignee: string;
  description?: string;
  leftBorderColor?: string;
}

export function Card({ id, title, leftBorderColor }: CardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const leftBorderClass = (leftBorderColor?: string) => {
    if (leftBorderColor) {
      return `border-l-8 ${leftBorderColor}`;
    }
    return '';
  };

  return (
    <div
      ref={setNodeRef}
      className={`m-4 flex touch-none rounded-lg bg-white p-4 shadow-lg ${leftBorderClass(
        leftBorderColor
      )}`}
      style={style}
      {...listeners}
      {...attributes}
    >
      {title}
    </div>
  );
}
