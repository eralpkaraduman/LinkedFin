import type { Relation, RelationType } from "./types"

export function buildChain(
  nameId: string,
  relationType: RelationType,
  allRelations: Relation[]
): string[] {
  const relations = allRelations.filter((r) => r.relation === relationType)

  // Find all names in the same chain
  const inChain = new Set<string>()
  const toCheck = [nameId]

  // Traverse both directions to find all connected names
  while (toCheck.length > 0) {
    const current = toCheck.pop()!
    if (inChain.has(current)) continue
    inChain.add(current)

    // Find relations where this name is source or target
    for (const rel of relations) {
      if (rel.source_id === current && !inChain.has(rel.target_id)) {
        toCheck.push(rel.target_id)
      }
      if (rel.target_id === current && !inChain.has(rel.source_id)) {
        toCheck.push(rel.source_id)
      }
    }
  }

  if (inChain.size <= 1) return []

  // For directional relations (smaller_than), find start and order
  if (relationType === "smaller_than") {
    const hasIncoming = new Set(
      relations.filter((r) => inChain.has(r.target_id)).map((r) => r.target_id)
    )
    const smallest = [...inChain].find((id) => !hasIncoming.has(id))

    const chain: string[] = []
    let current: string | undefined = smallest
    while (current) {
      chain.push(current)
      const next = relations.find((r) => r.source_id === current)
      current = next ? next.target_id : undefined
    }
    return chain
  }

  // For bidirectional relations, just return the set
  return [...inChain]
}

export function getRelationsForName(
  nameId: string,
  allRelations: Relation[]
): {
  borrowedFrom: Relation[]
  lentTo: Relation[]
  confusedWith: Relation[]
} {
  return {
    borrowedFrom: allRelations.filter(
      (r) => r.relation === "borrowed_from" && r.source_id === nameId
    ),
    lentTo: allRelations.filter(
      (r) => r.relation === "borrowed_from" && r.target_id === nameId
    ),
    confusedWith: allRelations.filter(
      (r) =>
        r.relation === "confused_with" &&
        (r.source_id === nameId || r.target_id === nameId)
    ),
  }
}
