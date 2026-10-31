export interface IdGenerator {
  nextId(prefix?: string): string;
}

export class CryptoIdGenerator implements IdGenerator {
  nextId(prefix = 'id'): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${prefix}_${crypto.randomUUID().slice(0, 12)}`;
    }
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;

  constructor(private readonly basePrefix = 'test') {}

  nextId(prefix?: string): string {
    this.counter += 1;
    return `${prefix || this.basePrefix}_${this.counter}`;
  }
}
