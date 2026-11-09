// POST /api/auth/logout  로그아웃
import { logout } from '../../../server/http/endpoints.js';

export const onRequestPost = logout;
