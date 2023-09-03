import { AssigneeCircle } from './assignee-circle';
import { Task } from './task';

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

interface chore {
  name: string;
  assignee: keyof typeof people;
  status: 'to-do' | 'in-progress' | 'done';
}

const chores: chore[] = [
  {
    name: 'Mow the lawn',
    assignee: 'A',
    status: 'to-do',
  },
  {
    name: 'Sweep Kitchen',
    assignee: 'B',
    status: 'to-do',
  },
  {
    name: 'Clean Bathroom',
    assignee: 'C',
    status: 'in-progress',
  },
];

const toDoChores = chores
  .filter((chore) => chore.status === 'to-do')
  .map((chore) => (
    <Task
      key={chore.name + chore.assignee}
      name={chore.name}
      assignee={chore.assignee}
    />
  ));

const inProgressChores = chores
  .filter((chore) => chore.status === 'in-progress')
  .map((chore) => (
    <Task
      key={chore.name + chore.assignee}
      name={chore.name}
      leftBorderColor={people[chore.assignee].borderColor}
    />
  ));

const assigneeCircles = Object.values(people).map((person) => (
  <AssigneeCircle name={person.name} color={person.bgColor} />
));

export function App() {
  return (
    <div className="grid-areas-scramble  grid-cols-scramble grid-rows-scramble grid h-screen">
      <nav className="grid-in-nav flex w-16 flex-col items-center justify-between bg-slate-900 py-3">
        <div className="flex flex-col gap-3">{assigneeCircles}</div>

        <div className="font-bold text-white">menu</div>
      </nav>
      <main className="grid-in-main flex h-full bg-slate-200 ">
        <div className="flex-1 border-r-4 border-black">
          <h3 className="bg-slate-600 py-3 text-center text-2xl font-bold text-white">
            To Do
          </h3>
          {toDoChores}
        </div>
        <div className="flex-1">
          <h3 className="bg-stone-600 py-3 text-center text-2xl font-bold text-white">
            In Progress
          </h3>
          {inProgressChores}
        </div>
      </main>
      <div className="grid-in-finnish bg-checkered w-12"></div>
    </div>
  );
}
