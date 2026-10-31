import { describe, expect, it } from 'vitest';
import { DEFAULT_ATTENDANCE, calibratePending, estimateAttendance } from './headcount';

describe('estimateAttendance', () => {
  it('weights uncertain guests by the assumptions and adds a catering buffer', () => {
    const e = estimateAttendance({ yes: 100, maybe: 20, pending: 50, declined: 30 });
    // likely = 100 + 20*0.5 + 50*0.8 = 150; catering = ceil(150 * 1.05) = 158
    expect(e).toEqual({ low: 125, likely: 150, high: 170, cateringHeadcount: 158 });
  });

  it('handles an empty list', () => {
    expect(estimateAttendance({ yes: 0, maybe: 0, pending: 0, declined: 0 })).toEqual({ low: 0, likely: 0, high: 0, cateringHeadcount: 0 });
  });
});

describe('calibratePending', () => {
  it('raises the pending-guest probability when more people turned up than planned', () => {
    expect(calibratePending(DEFAULT_ATTENDANCE, 100, 110).pPending).toBe(0.88);
  });
  it('bounds the correction and never exceeds 100%', () => {
    expect(calibratePending(DEFAULT_ATTENDANCE, 100, 400).pPending).toBe(1);
    expect(calibratePending(DEFAULT_ATTENDANCE, 100, 10).pPending).toBe(0.6);
    expect(calibratePending(DEFAULT_ATTENDANCE, 0, 10)).toEqual(DEFAULT_ATTENDANCE);
  });
});
