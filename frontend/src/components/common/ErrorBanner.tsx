const ErrorBanner = ({ message }) => {
  if (!message) return null;
  return (
    <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700">
      {message}
    </div>
  );
};

export default ErrorBanner;
