/**
 * STEMotion Front-End - Media Library Service
 * Connects to Backend LibraryController (/api/v1/library)
 */

import { apiClient } from './apiClient';
import { STEMSubject } from '../types/stem';

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
}

export interface LibraryFilters {
  subjects: STEMSubject[];
  gradeLevels: string[];
}

export const libraryService = {
  /**
   * List published clips from the internal media library.
   * Optionally filtered by subject and/or grade level.
   */
  async getPublishedClips(subject?: STEMSubject | '', gradeLevel?: string): Promise<LibraryItem[]> {
    const params = new URLSearchParams();
    if (subject) params.append('subject', subject);
    if (gradeLevel) params.append('gradeLevel', gradeLevel);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await apiClient.get<LibraryItem[]>(`/library/clips${query}`);
    return Array.isArray(res) ? res : [];
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
  async getFilters(): Promise<LibraryFilters> {
    const res = await apiClient.get<LibraryFilters>('/library/filters');
    return {
      subjects: res?.subjects || [],
      gradeLevels: res?.gradeLevels || [],
    };
  },
};
