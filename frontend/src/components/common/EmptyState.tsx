const EmptyState = ({ title, description }) => {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-slate-500">
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-2 text-sm">{description}</p>}
    </div>
  );
};

export default EmptyState;
