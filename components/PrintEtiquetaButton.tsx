"use client";

type Props = { caixaId: string | number };

export default function PrintEtiquetaButton({ caixaId }: Props) {
  const handlePrint = () => {
    window.open(`/etiquetas/${caixaId}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handlePrint}
      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
    >
      Imprimir Etiqueta
    </button>
  );
}
