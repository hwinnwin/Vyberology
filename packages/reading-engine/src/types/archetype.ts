export type ArchetypeId = string; // added by Lumen (Stage 4A)

export type ArchetypeDescriptor = { // added by Lumen (Stage 4A)
  label: string;
  summary: string;
  element: string;
}; 

export type ArchetypeMap = Record<ArchetypeId, ArchetypeDescriptor>; // added by Lumen (Stage 4A)
