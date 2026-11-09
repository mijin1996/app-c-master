// GET /api/community/problem?id=3  문제 하나와 토론 댓글
import { communityProblem } from '../../../server/http/endpoints.js';

export const onRequestGet = communityProblem;
