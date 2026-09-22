export type ClassId = '501' | '502' | '503' | '504'

export declare const CLASS_IDS: ClassId[]
export declare const CLASS_LABELS: Record<ClassId, string>
export declare const ROSTER: Record<ClassId, string[]>
export declare const TOTAL_STUDENTS: number

export declare function studentKey(classId: string, name: string): string
export declare function isValidStudent(classId: string, name: string): boolean
export declare function classSize(classId: string): number
