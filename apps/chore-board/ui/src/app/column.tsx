import { useDroppable } from '@dnd-kit/core';

import { Card } from './card';

export interface ColumnProps {
  title: string;
  columnId: string;
  items: Item[];
}

export interface Item {
  id: number | string;
  title: string;
  assignee: string;
  status: string;
  leftBorderColor: string;
}

export function Column({ title, items, columnId }: ColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: columnId,
  });
  const style = {
    color: isOver ? 'green' : undefined,
  };

  const itemsList = items.map((item) => <Card key={item.id} {...item} />);
  return (
    <div ref={setNodeRef} className="flex-1 border-r-4 border-black">
      <h3
        className="bg-slate-600 py-3 text-center text-2xl font-bold text-white"
        style={style}
      >
        {title}
      </h3>
      {itemsList}
    </div>
  );
}
