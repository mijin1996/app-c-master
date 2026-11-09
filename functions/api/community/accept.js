// POST /api/community/accept  답변 채택 {commentId} (문제 낸 사람만)
import { communityAccept } from '../../../server/http/endpoints.js';

export const onRequestPost = communityAccept;
