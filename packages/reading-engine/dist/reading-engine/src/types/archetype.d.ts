export type ArchetypeId = string;
export type ArchetypeDescriptor = {
    label: string;
    summary: string;
    element: string;
};
export type ArchetypeMap = Record<ArchetypeId, ArchetypeDescriptor>;
