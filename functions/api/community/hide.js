// POST /api/community/hide  숨기기/보이기 {targetType, targetId, hidden} (선생님만)
import { communityHide } from '../../../server/http/endpoints.js';

export const onRequestPost = communityHide;
