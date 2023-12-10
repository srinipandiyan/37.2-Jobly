const { BadRequestError } = require("../expressError");

/**
 * Generates a SET clause with parameter values for a partial update of the database.
 * 
 * @param {Object} dataToUpdate --an object containing data for update.
 * @param {Object} jsToSql --a mapping object that translates JavaScript variable names into SQL column names
 * @throws {BadRequestError} throws custom error if no data is provided within dataToUpdate obj
 * @returns {Object} with properties:
 *    -setCols {string} - SQL SET clause with comma-joined, column-value pairs.
 *    -values {array} - Array of values from dataToUpdate for use as SQL query parameters.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  // Check to see whether any data is available to update
  if (keys.length === 0) throw new BadRequestError("No data");

  /**  
   * Map keys to SQL column-value pairs
   * {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
   */

  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
