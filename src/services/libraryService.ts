/**
 * STEMotion Front-End - Media Library Service
 * Connects to Backend LibraryController (/api/v1/library)
 */

import { apiClient } from './apiClient';
import { STEMSubject } from '../types/stem';

export interface LearningCard {
  schemaVersion: 'stem-learning-card.v1'; publicationId: string; snapshotId?: string;
  verificationStatus: 'UNVERIFIED' | 'LEGACY_UNMAPPED'; educationLevel?: string; gradeKey?: string;
  subjectKeys?: string[]; outcomeIds?: string[]; distributionChannels?: string[];
  context?: { primary?: {key: string; condition?: string; adaptations?: string} | null; secondary?: Array<{key: string; condition?: string; adaptations?: string}> };
  objectives?: Array<{ key: string; learnerAction?: string; observableEvidence?: string }>;
  studentTasks?: Array<{ key: string; learnerAction?: string; teacherSupport?: string; materials?: string; safety?: string; assessmentEvidence?: string; executionContextKey?: string }>;
  scopeOfClip?: string; safetyNotes?: string; sources?: Array<{id?: string; kind?: string; version?: number; title?: string; citation?: string; locator?: string}>;
  capturedMode?: string; expertVerified?: false;
}
export interface LibraryQuery {
  page?: number; size?: number; q?: string; educationLevel?: string; grade?: string; subjectId?: string; outcomeId?: string;
  usageContext?: string; contextRole?: string; channel?: string; verificationStatus?: string;
}
export type LibraryRows = LibraryItem[] & { pagination?: {total: number | null; page: number; size: number; pages: number | null} };

export interface LibraryItem {
  id: string;
  title: string;
  subject: STEMSubject;
  gradeLevel: string;
  totalDurationSeconds: number;
  sceneCount: number;
  ownerName: string;
  workspaceName: string;
  videoUrl: string;
  embedCode: string;
  youtubeUrl?: string | null;
  publishedAt: string;
  verificationStatus?: 'UNVERIFIED'|'LEGACY_UNMAPPED';
  snapshotId?: string|null;
  learningCard?: LearningCard | null;
}

export interface LibraryFilters {
  subjects: STEMSubject[];
  gradeLevels: string[];
  educationLevels?: string[]; subjectIds?: string[]; outcomeIds?: string[]; usageContexts?: string[]; channels?: string[]; verificationStatuses?: string[];
}

export const libraryService = {
  /**
   * List published clips from the internal media library.
   * Optionally filtered by subject and/or grade level.
   */
  async getPublishedClips(subject?: STEMSubject | '', gradeLevel?: string, options?: LibraryQuery): Promise<LibraryRows> {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (gradeLevel) params.append('gradeLevel', gradeLevel);
    for (const [key, value] of Object.entries(options ?? {})) if (value !== '' && value != null) params.set(key, String(value));

    const query = params.toString() ? `?${params.toString()}` : '';
    if (!options) { const res = await apiClient.get<LibraryItem[]>(`/library/clips${query}`); return Array.isArray(res) ? res : []; }
    const result = await apiClient.getPage<LibraryItem[]>(`/library/clips${query}`);
    const rows: LibraryRows = Array.isArray(result.data) ? result.data : [];
    Object.defineProperty(rows, 'pagination', {value: {total: result.total, page: result.page, size: result.size, pages: result.pages}, enumerable: false});
    return rows;
  },

  /**
   * Get single published clip detail with export links
   */
  async getClipDetail(projectId: string): Promise<LibraryItem> {
    return apiClient.get<LibraryItem>(`/library/clips/${projectId}`);
  },

  /**
   * Get available filter options (subjects and grades that have published clips)
   */
  async getFilters(options: LibraryQuery = {}): Promise<LibraryFilters> {
    const params = new URLSearchParams(); for (const [key,value] of Object.entries(options)) if (value != null && value !== '' && key !== 'page' && key !== 'size') params.set(key,String(value));
    const res = await apiClient.get<LibraryFilters>('/library/filters'+(params.size ? '?'+params : ''));
    return { ...res,
      subjects: res?.subjects || [],
      gradeLevels: res?.gradeLevels || [],
    };
  },
};
