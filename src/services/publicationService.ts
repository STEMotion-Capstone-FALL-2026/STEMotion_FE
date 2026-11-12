import { apiClient } from './apiClient';

export interface PublicationResponse {
  id: string;
  projectId: string;
  lmsEmbedCode: string | null;
  youtubeUrl: string | null;
  publishedAt: string;
}

export const publicationService = {
  publishInternal(projectId: string, title: string, options?:{legacyUnverifiedAcknowledged:boolean;artifactExpectation?:import('../types/stem').StemArtifactExpectation;idempotencyKey:string}): Promise<PublicationResponse> {
    return apiClient.post(`/scripts/${projectId}/publish`, {
      targets: ['INTERNAL_LIBRARY', 'LMS'], title,
      ...(options?{legacyUnverifiedAcknowledged:options.legacyUnverifiedAcknowledged,artifactExpectation:options.artifactExpectation,idempotencyKey:options.idempotencyKey}:{}),
    });
  },
};
