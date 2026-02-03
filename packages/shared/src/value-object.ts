/**
 * Base class for value objects.
 *
 * ARCHITECTURAL DECISION:
 * Value objects are immutable and compared by their attributes,
 * not by identity. They encapsulate validation logic.
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
