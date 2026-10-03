/** Placeholder de la etapa (e): nombre del edificio, respaldos, tema y tamaño de texto. */
export function PantallaAjustes() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Ajustes</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Los respaldos y las preferencias se construyen en una etapa posterior.
        </p>
      </div>
    </div>
  );
}
