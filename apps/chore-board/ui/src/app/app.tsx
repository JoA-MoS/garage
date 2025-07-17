import { DndContext, DragOverEvent } from '@dnd-kit/core';
import { useState } from 'react';

import { AssigneeCircle } from './assignee-circle';
import { Column } from './column';
import { CompleteColumn } from './complete-column';

const people = {
  A: {
    name: 'AZ',
    bgColor: 'bg-cyan-400',
    borderColor: 'border-cyan-400',
  },
  B: {
    name: 'BY',
    bgColor: 'bg-purple-400',
    borderColor: 'border-purple-400',
  },
  C: {
    name: 'CX',
    bgColor: 'bg-green-400',
    borderColor: 'border-green-400',
  },
};

type Status = 'to-do' | 'in-progress' | 'done';

interface Chore {
  id: number;
  title: string;
  assignee: keyof typeof people;
  status: Status;
}

const defaultChores: Chore[] = [
  {
    id: 1,
    title: 'Mow the lawn',
    assignee: 'A',
    status: 'to-do',
  },
  {
    id: 2,
    title: 'Sweep Kitchen',
    assignee: 'B',
    status: 'to-do',
  },
  {
    id: 3,
    title: 'Clean Bathroom',
    assignee: 'C',
    status: 'to-do',
  },
];

export function App() {
  const [items, setItems] = useState<Chore[]>(defaultChores);

  const assigneeCircles = Object.values(people).map((person) => (
    <AssigneeCircle
      key={person.name}
      name={person.name}
      color={person.bgColor}
    />
  ));

  const toDoItems = items
    .filter((chore) => chore.status === 'to-do')
    .map(({ id, title, assignee, status }) => {
      return {
        id,
        title,
        assignee,
        leftBorderColor: people[assignee].borderColor,
        status,
      };
    });

  const inProgressItems = items
    .filter((chore) => chore.status === 'in-progress')
    .map(({ id, title, assignee, status }) => {
      return {
        id,
        title,
        assignee,
        leftBorderColor: people[assignee].borderColor,
        status,
      };
    });

  function handleDragEnd({ active, over }: DragOverEvent) {
    const choreIdx = items.findIndex((c) => c.id === active.id);
    const updatedChore = {
      ...items[choreIdx],
      status: (over?.id as Status) || 'to-do',
    };
    const updatedChores = [...items];
    updatedChores[choreIdx] = updatedChore;
    setItems(updatedChores);
  }

  return (
    <div className="grid-areas-scramble  grid-cols-scramble grid-rows-scramble grid h-screen overflow-hidden">
      <nav className="grid-in-nav flex w-16 flex-col items-center justify-between bg-slate-900 py-3">
        <div className="flex flex-col gap-3">{assigneeCircles}</div>

        <div className="font-bold text-white">menu</div>
      </nav>
      <DndContext onDragEnd={handleDragEnd}>
        <main className="grid-in-main flex h-full bg-slate-200 ">
          <Column title="To-Do" columnId="to-do" items={toDoItems} />
          <Column
            title="In-Progress"
            columnId="in-progress"
            items={inProgressItems}
          />
        </main>
        <CompleteColumn />
      </DndContext>
      <div className="grid-in-footer">{JSON.stringify(items, null, 2)}</div>
    </div>
  );
}
