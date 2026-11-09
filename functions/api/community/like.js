// POST /api/community/like  좋아요 켜기/끄기 {targetType, targetId}
import { communityLike } from '../../../server/http/endpoints.js';

export const onRequestPost = communityLike;
