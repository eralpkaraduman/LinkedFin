import { describe, it, expect } from "vitest"
import { buildChain, getRelationsForName } from "../relations"
import type { Relation } from "../types"

describe("relations", () => {
  describe("buildChain", () => {
    it("returns empty array when no relations exist", () => {
      const result = buildChain("nm_001", "smaller_than", [])
      expect(result).toEqual([])
    })

    it("returns empty array when name not in any chain", () => {
      const relations: Relation[] = [
        { source_id: "nm_001", target_id: "nm_002", relation: "smaller_than" },
      ]
      const result = buildChain("nm_003", "smaller_than", relations)
      expect(result).toEqual([])
    })

    it("builds ordered chain for smaller_than", () => {
      const relations: Relation[] = [
        { source_id: "nm_001", target_id: "nm_002", relation: "smaller_than" },
        { source_id: "nm_002", target_id: "nm_003", relation: "smaller_than" },
      ]
      const result = buildChain("nm_002", "smaller_than", relations)
      expect(result).toEqual(["nm_001", "nm_002", "nm_003"])
    })

    it("builds set for bidirectional relations", () => {
      const relations: Relation[] = [
        { source_id: "nm_001", target_id: "nm_002", relation: "alternate_of" },
        { source_id: "nm_002", target_id: "nm_003", relation: "alternate_of" },
      ]
      const result = buildChain("nm_002", "alternate_of", relations)
      expect(result).toHaveLength(3)
      expect(result).toContain("nm_001")
      expect(result).toContain("nm_002")
      expect(result).toContain("nm_003")
    })
  })

  describe("getRelationsForName", () => {
    const relations: Relation[] = [
      { source_id: "nm_001", target_id: "nm_002", relation: "borrowed_from" },
      { source_id: "nm_003", target_id: "nm_001", relation: "borrowed_from" },
      { source_id: "nm_001", target_id: "nm_004", relation: "confused_with" },
      { source_id: "nm_005", target_id: "nm_001", relation: "male_of" },
      { source_id: "nm_006", target_id: "nm_001", relation: "female_of" },
    ]

    it("finds borrowedFrom relations", () => {
      const result = getRelationsForName("nm_001", relations)
      expect(result.borrowedFrom).toHaveLength(1)
      expect(result.borrowedFrom[0].target_id).toBe("nm_002")
    })

    it("finds lentTo relations", () => {
      const result = getRelationsForName("nm_001", relations)
      expect(result.lentTo).toHaveLength(1)
      expect(result.lentTo[0].source_id).toBe("nm_003")
    })

    it("finds confusedWith relations (bidirectional)", () => {
      const result = getRelationsForName("nm_001", relations)
      expect(result.confusedWith).toHaveLength(1)
    })

    it("finds hasMale relations", () => {
      const result = getRelationsForName("nm_001", relations)
      expect(result.hasMale).toHaveLength(1)
      expect(result.hasMale[0].source_id).toBe("nm_005")
    })

    it("finds hasFemale relations", () => {
      const result = getRelationsForName("nm_001", relations)
      expect(result.hasFemale).toHaveLength(1)
      expect(result.hasFemale[0].source_id).toBe("nm_006")
    })

    it("finds maleOf relations", () => {
      const result = getRelationsForName("nm_005", relations)
      expect(result.maleOf).toHaveLength(1)
      expect(result.maleOf[0].target_id).toBe("nm_001")
    })

    it("finds femaleOf relations", () => {
      const result = getRelationsForName("nm_006", relations)
      expect(result.femaleOf).toHaveLength(1)
      expect(result.femaleOf[0].target_id).toBe("nm_001")
    })
  })
})
