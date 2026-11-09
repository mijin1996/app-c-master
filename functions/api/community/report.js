// POST /api/community/report  신고 {targetType, targetId, reason}
import { communityReport } from '../../../server/http/endpoints.js';

export const onRequestPost = communityReport;
