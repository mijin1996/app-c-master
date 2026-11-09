// POST /api/auth/nickname  닉네임 바꾸기
import { changeNickname } from '../../../server/http/endpoints.js';

export const onRequestPost = changeNickname;
