import { apiClient } from './apiClient';

export type YouTubeUploadStatus = 'PENDING' | 'UPLOADING' | 'UPLOADED' | 'FAILED';
export type YouTubePrivacy = 'private' | 'unlisted' | 'public';

export interface PublicationResponse {
  id: string;
  projectId: string;
  lmsEmbedCode: string | null;
  youtubeUrl: string | null;
  publishedAt: string;
  uploadStatus?: YouTubeUploadStatus | null;
  uploadError?: string | null;
  externalId?: string | null;
}

export interface YouTubeMetadata {
  title: string;
  description?: string;
  tags?: string[];
  privacyStatus: YouTubePrivacy;
  selfDeclaredMadeForKids: boolean;
}

export interface YouTubePublishOptions {
  /**
   * Retry of a FAILED YouTube upload. The API only publishes a QA-approved clip, and the library
   * publication already exists, so the retry sends YOUTUBE alone; a first publish sends all three targets.
   */
  retryFailedUpload: boolean;
  idempotencyKey: string;
  legacyUnverifiedAcknowledged?: boolean;
  artifactExpectation?: import('../types/stem').StemArtifactExpectation;
}

export const publicationService = {
  publishInternal(projectId: string, title: string, options?:{legacyUnverifiedAcknowledged:boolean;artifactExpectation?:import('../types/stem').StemArtifactExpectation;idempotencyKey:string}): Promise<PublicationResponse> {
    return apiClient.post(`/scripts/${projectId}/publish`, {
      targets: ['INTERNAL_LIBRARY', 'LMS'], title,
      ...(options?{legacyUnverifiedAcknowledged:options.legacyUnverifiedAcknowledged,artifactExpectation:options.artifactExpectation,idempotencyKey:options.idempotencyKey}:{}),
    });
  },

  publishYoutube(projectId: string, metadata: YouTubeMetadata, options: YouTubePublishOptions): Promise<PublicationResponse> {
    const tags = (metadata.tags ?? []).map(tag => tag.trim()).filter(Boolean);
    return apiClient.post(`/scripts/${projectId}/publish`, {
      targets: options.retryFailedUpload ? ['YOUTUBE'] : ['INTERNAL_LIBRARY', 'LMS', 'YOUTUBE'],
      title: metadata.title.trim(),
      ...(metadata.description?.trim() ? { description: metadata.description.trim() } : {}),
      ...(tags.length ? { tags } : {}),
      privacyStatus: metadata.privacyStatus,
      selfDeclaredMadeForKids: metadata.selfDeclaredMadeForKids,
      idempotencyKey: options.idempotencyKey,
      ...(options.legacyUnverifiedAcknowledged !== undefined ? { legacyUnverifiedAcknowledged: options.legacyUnverifiedAcknowledged } : {}),
      ...(options.artifactExpectation ? { artifactExpectation: options.artifactExpectation } : {}),
    });
  },

  listPublications(projectId: string): Promise<PublicationResponse[]> {
    return apiClient.get(`/scripts/${projectId}/publications`);
  },
};
