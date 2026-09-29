interface EmptyStateProps {
  title: string;
  message: string;
  action?: React.ReactNode;
}

function EmptyState({
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📚</div>

      <h3>{title}</h3>

      <p>{message}</p>

      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
}

export default EmptyState;