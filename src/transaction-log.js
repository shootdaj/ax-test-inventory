'use strict';

/**
 * @typedef {Object} TransactionRecord
 * @property {string} id - Unique transaction ID
 * @property {string} sku - Item SKU
 * @property {string} action - Action type: 'add', 'remove', or 'update'
 * @property {Object} details - Action-specific details
 * @property {string} reason - Reason for the action
 * @property {string} timestamp - ISO timestamp
 */

/**
 * Append-only transaction log for tracking all inventory mutations.
 * Each mutation (add, remove, update) creates a new log entry with
 * a timestamp and reason for auditability.
 *
 * @example
 * const log = inventory.transactionLog;
 * const entries = log.getBySku('WDG-001');
 */
class TransactionLog {
  constructor() {
    /** @type {TransactionRecord[]} */
    this._entries = [];
    /** @type {number} */
    this._nextId = 1;
  }

  /**
   * Append a new entry to the log.
   *
   * @param {Object} entry - Log entry data
   * @param {string} entry.sku - Item SKU
   * @param {string} entry.action - Action type ('add', 'remove', 'update')
   * @param {Object} entry.details - Action-specific details
   * @param {string} entry.reason - Reason for the action
   * @returns {TransactionRecord} The created log entry
   */
  append(entry) {
    const record = {
      id: String(this._nextId++),
      sku: entry.sku,
      action: entry.action,
      details: entry.details,
      reason: entry.reason,
      timestamp: new Date().toISOString(),
    };
    this._entries.push(record);
    return record;
  }

  /**
   * Get all log entries.
   *
   * @returns {TransactionRecord[]} All entries (copies)
   */
  getAll() {
    return this._entries.map(e => ({ ...e }));
  }

  /**
   * Get log entries for a specific SKU.
   *
   * @param {string} sku - SKU to filter by
   * @returns {TransactionRecord[]} Matching entries (copies)
   */
  getBySku(sku) {
    return this._entries
      .filter(e => e.sku === sku)
      .map(e => ({ ...e }));
  }

  /**
   * Get log entries by action type.
   *
   * @param {string} action - Action type ('add', 'remove', 'update')
   * @returns {TransactionRecord[]} Matching entries (copies)
   */
  getByAction(action) {
    return this._entries
      .filter(e => e.action === action)
      .map(e => ({ ...e }));
  }

  /**
   * Get log entries within a date range.
   *
   * @param {Date|string} from - Start date (inclusive)
   * @param {Date|string} to - End date (inclusive)
   * @returns {TransactionRecord[]} Matching entries (copies)
   */
  getByDateRange(from, to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return this._entries
      .filter(e => {
        const ts = new Date(e.timestamp);
        return ts >= fromDate && ts <= toDate;
      })
      .map(e => ({ ...e }));
  }

  /**
   * Get the number of entries in the log.
   *
   * @returns {number} Entry count
   */
  get length() {
    return this._entries.length;
  }

  /**
   * Clear all log entries.
   */
  clear() {
    this._entries = [];
    this._nextId = 1;
  }
}

module.exports = TransactionLog;
