// Mapper 들이 같이 쓰는 작은 검사 함수
export const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
