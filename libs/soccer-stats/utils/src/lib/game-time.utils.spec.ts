import {
  toPeriodSecond,
  fromPeriodSecond,
  formatGameTime,
  formatGameTimeCompact,
  formatPeriodTime,
  getDisplayMinute,
  isStoppageTime,
  formatStoppageTime,
  PERIOD_DURATIONS,
} from './game-time.utils';

describe('game-time.utils', () => {
  describe('toPeriodSecond', () => {
    it('should convert minute and second to total seconds', () => {
      expect(toPeriodSecond(0, 0)).toBe(0);
      expect(toPeriodSecond(1, 0)).toBe(60);
      expect(toPeriodSecond(1, 30)).toBe(90);
      expect(toPeriodSecond(45, 0)).toBe(2700);
    });

    it('should default second to 0 when not provided', () => {
      expect(toPeriodSecond(5)).toBe(300);
      expect(toPeriodSecond(22)).toBe(1320);
    });
  });

  describe('fromPeriodSecond', () => {
    it('should convert period seconds to minute and second', () => {
      expect(fromPeriodSecond(0)).toEqual({ minute: 0, second: 0 });
      expect(fromPeriodSecond(60)).toEqual({ minute: 1, second: 0 });
      expect(fromPeriodSecond(90)).toEqual({ minute: 1, second: 30 });
      expect(fromPeriodSecond(2700)).toEqual({ minute: 45, second: 0 });
      expect(fromPeriodSecond(1325)).toEqual({ minute: 22, second: 5 });
    });
  });

  describe('getDisplayMinute', () => {
    it('should return minute directly for period 1', () => {
      expect(getDisplayMinute('1', 0)).toBe(0);
      expect(getDisplayMinute('1', 1320)).toBe(22); // 22 min into period 1
      expect(getDisplayMinute('1', 2700)).toBe(45); // 45 min
    });

    it('should add period duration for period 2', () => {
      expect(getDisplayMinute('2', 0)).toBe(45); // start of 2nd half
      expect(getDisplayMinute('2', 1320)).toBe(67); // 22 min into 2nd half = 67'
      expect(getDisplayMinute('2', 2700)).toBe(90); // end of regular time
    });

    it('should handle overtime periods', () => {
      expect(getDisplayMinute('OT1', 0)).toBe(90); // start of OT1
      expect(getDisplayMinute('OT1', 900)).toBe(105); // 15 min into OT1 = 105'
      expect(getDisplayMinute('OT2', 0)).toBe(105); // start of OT2
      expect(getDisplayMinute('OT2', 600)).toBe(115); // 10 min into OT2
    });

    it('should use custom period duration', () => {
      // 30-minute halves (youth game)
      expect(getDisplayMinute('1', 1800, 30)).toBe(30);
      expect(getDisplayMinute('2', 0, 30)).toBe(30);
      expect(getDisplayMinute('2', 600, 30)).toBe(40); // 10 min into 2nd = 40'
    });
  });

  describe('formatGameTime', () => {
    it('should format period 1 time with consistent MM:SS format', () => {
      expect(formatGameTime('1', 0)).toBe("00:00'");
      expect(formatGameTime('1', 1325)).toBe("22:05'");
      expect(formatGameTime('1', 2700)).toBe("45:00'");
    });

    it('should format period 2 time with offset', () => {
      expect(formatGameTime('2', 0)).toBe("45:00'");
      expect(formatGameTime('2', 1325)).toBe("67:05'"); // 22:05 into 2nd half
      expect(formatGameTime('2', 2700)).toBe("90:00'");
    });

    it('should format overtime correctly', () => {
      expect(formatGameTime('OT1', 300)).toBe("95:00'"); // 5 min into OT1
    });

    it('should handle 100+ minutes with MMM:SS format', () => {
      expect(formatGameTime('OT1', 900)).toBe("105:00'"); // end of OT1
      expect(formatGameTime('OT2', 900)).toBe("120:00'"); // end of OT2
      expect(formatGameTime('OT2', 905)).toBe("120:05'");
    });
  });

  describe('formatGameTimeCompact', () => {
    it('should format without apostrophe', () => {
      expect(formatGameTimeCompact('1', 0)).toBe('00:00');
      expect(formatGameTimeCompact('1', 1325)).toBe('22:05');
      expect(formatGameTimeCompact('2', 1325)).toBe('67:05');
    });

    it('should handle 100+ minutes', () => {
      expect(formatGameTimeCompact('OT1', 900)).toBe('105:00');
    });
  });

  describe('formatPeriodTime', () => {
    it('should always format time within period as MM:SS', () => {
      expect(formatPeriodTime(0)).toBe("00:00'");
      expect(formatPeriodTime(1320)).toBe("22:00'");
      expect(formatPeriodTime(1325)).toBe("22:05'");
    });
  });

  describe('isStoppageTime', () => {
    it('should detect stoppage time', () => {
      expect(isStoppageTime(2700)).toBe(false); // exactly 45:00
      expect(isStoppageTime(2701)).toBe(true); // 45:01 - stoppage
      expect(isStoppageTime(2880)).toBe(true); // 48:00 - 3 min stoppage
    });

    it('should use custom period duration', () => {
      expect(isStoppageTime(1800, 30)).toBe(false); // exactly 30:00
      expect(isStoppageTime(1801, 30)).toBe(true); // stoppage in 30-min half
    });
  });

  describe('formatStoppageTime', () => {
    it('should return null when not in stoppage', () => {
      expect(formatStoppageTime(2700)).toBeNull();
      expect(formatStoppageTime(2600)).toBeNull();
    });

    it('should format stoppage time correctly', () => {
      expect(formatStoppageTime(2760)).toBe("45+1'"); // 1 min stoppage
      expect(formatStoppageTime(2880)).toBe("45+3'"); // 3 min stoppage
      expect(formatStoppageTime(2890)).toBe("45+3:10'"); // 3:10 stoppage
    });

    it('should handle custom period duration', () => {
      expect(formatStoppageTime(1860, 30)).toBe("30+1'"); // 1 min stoppage in 30-min half
    });
  });

  describe('PERIOD_DURATIONS', () => {
    it('should have correct standard values', () => {
      expect(PERIOD_DURATIONS.STANDARD).toBe(45);
      expect(PERIOD_DURATIONS.YOUTH_30).toBe(30);
      expect(PERIOD_DURATIONS.YOUTH_25).toBe(25);
      expect(PERIOD_DURATIONS.OVERTIME).toBe(15);
    });
  });
});
