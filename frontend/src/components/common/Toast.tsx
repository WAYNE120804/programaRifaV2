const Toast = ({ message, type = 'success' }) => {
  if (!message) return null;
  const color = type === 'error' ? 'bg-rose-600' : 'bg-emerald-600';
  return (
    <div className={`rounded-md px-4 py-2 text-sm text-white ${color}`}>
      {message}
    </div>
  );
};

export default Toast;
