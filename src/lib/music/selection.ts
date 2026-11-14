/** Helpers de seleção múltipla: "selecionar todas" e alternar uma faixa. */

/** Verdadeiro quando toda faixa visível está selecionada (lista vazia nunca conta como selecionada). */
export function allSelected(ids: string[], selected: Set<string>): boolean {
  return ids.length > 0 && ids.every((id) => selected.has(id));
}

/** Se tudo já estava selecionado, desmarca tudo; senão marca tudo que está visível. */
export function toggleAll(ids: string[], selected: Set<string>): Set<string> {
  const next = new Set(selected);
  if (allSelected(ids, selected)) ids.forEach((id) => next.delete(id));
  else ids.forEach((id) => next.add(id));
  return next;
}

/** Alterna uma única faixa sem mexer nas demais. */
export function toggleOne(id: string, selected: Set<string>): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
