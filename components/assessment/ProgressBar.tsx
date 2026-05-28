type ProgressBarProps = {
  current: number;
  total: number;
};

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="progress-track">
      <div
        className="progress-bar"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}