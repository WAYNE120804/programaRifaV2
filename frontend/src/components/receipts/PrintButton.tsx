type PrintButtonProps = {
  onClick: () => void;
};

const PrintButton = ({ onClick }: PrintButtonProps) => {
  return (
    <button
      type="button"
      className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
      onClick={onClick}
    >
      Imprimir
    </button>
  );
};

export default PrintButton;
