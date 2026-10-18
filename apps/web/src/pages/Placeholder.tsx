export default function Placeholder({ title, step }: { title: string; step: string }) {
  return (
    <>
      <h1>{title}</h1>
      <p className="muted">Coming in {step}.</p>
    </>
  );
}
