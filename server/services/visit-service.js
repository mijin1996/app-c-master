// Service: 하루 접속 수 규칙 — 날짜는 한국 시간, 기록하면 1 늘리고, 보기는 늘리지 않는다
import { Result, Failure } from '../../public/js/core/result.js';
import { kstDayKey } from '../../public/js/domain/visit-rules.js';

export class VisitService {
    #visits;
    #clock;

    constructor(visitRepository, clock) {
        this.#visits = visitRepository;
        this.#clock = clock;
    }

    /** 접속 하나 기록 → { day, count } */
    async recordAsync() {
        const day = kstDayKey(this.#clock());
        const counted = await this.#visits.incrementAsync(day);
        return counted instanceof Failure ? counted : Result.success({ day, count: counted.data });
    }

    /** 오늘 숫자만 보기 → { day, count } */
    async todayAsync() {
        const day = kstDayKey(this.#clock());
        const counted = await this.#visits.countAsync(day);
        return counted instanceof Failure ? counted : Result.success({ day, count: counted.data });
    }
}
