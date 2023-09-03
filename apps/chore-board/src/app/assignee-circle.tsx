export function AssigneeCircle({
  name,
  color,
}: {
  name: string;
  color: string;
}) {
  return (
    <div
      className={`h-12 w-12 rounded-full ${color} flex items-center justify-center`}
    >
      {name}
    </div>
  );
}
