export interface TaskProps {
  name: string;
  leftBorderColor?: string;
  status?: string;
  assignee?: string;
}

const leftBorderClass = (leftBorderColor?: string) => {
  if (leftBorderColor) {
    return `border-l-8 ${leftBorderColor}`;
  }
  return '';
};

export function Task({ name, status, assignee, leftBorderColor }: TaskProps) {
  return (
    <div
      className={`m-4 flex rounded-lg   bg-white  p-4 shadow-lg ${leftBorderClass(
        leftBorderColor
      )}`}
    >
      {name}
    </div>
  );
}
