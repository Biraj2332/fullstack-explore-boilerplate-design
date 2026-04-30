// Value object — self-validating, immutable

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new Error(`Invalid email: ${value}`);
    }
    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
