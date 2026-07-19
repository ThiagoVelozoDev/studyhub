export interface EditalCategoria {
  value: string;
  label: string;
}

// Lista extensível de propósito: adicionar uma carreira nova é só
// acrescentar um item aqui — `Edital.categoria` é `string`, não union type,
// então não exige migração de schema.
export const EDITAL_CATEGORIAS: EditalCategoria[] = [
  { value: "policial", label: "Policial" },
  { value: "tribunais", label: "Tribunais" },
  { value: "fiscal", label: "Fiscal/Receita" },
  { value: "administrativo", label: "Administrativo/Federal" },
  { value: "outros", label: "Outros" },
];

export function getEditalCategoriaLabel(value: string): string {
  return EDITAL_CATEGORIAS.find((c) => c.value === value)?.label ?? value;
}
