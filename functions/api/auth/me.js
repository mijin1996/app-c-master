// GET /api/auth/me  지금 로그인한 회원
import { me } from '../../../server/http/endpoints.js';

export const onRequestGet = me;
