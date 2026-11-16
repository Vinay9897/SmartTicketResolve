import Card, { CardHeader } from "./Card.jsx";

export function ChartCard({ title, description, action, children, className = "" }) {
  return (
    <Card className={`min-w-0 ${className}`}>
      <CardHeader title={title} description={description} action={action} />
      {children}
    </Card>
  );
}
