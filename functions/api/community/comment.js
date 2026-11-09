// POST /api/community/comment  댓글 쓰기 {problemId, body}
import { communityComment } from '../../../server/http/endpoints.js';

export const onRequestPost = communityComment;
