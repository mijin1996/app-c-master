// POST /api/auth/recovery-code  복구 코드 새로 만들기
import { renewRecoveryCode } from '../../../server/http/endpoints.js';

export const onRequestPost = renewRecoveryCode;
