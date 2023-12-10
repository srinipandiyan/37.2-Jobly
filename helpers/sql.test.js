const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require("../expressError");

describe('sqlForPartialUpdate', () => {
  it('Should generate a SET clause with parameter values', () => {
    const dataToUpdate = { firstName: 'Paul', age: 18 };
    const jsToSql = { firstName: 'first_name', age: 'age' };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ['Paul', 18],
    });

  });

  it('should throw a BadRequestError if no data can be extracted from arguments', () => {
    const dataToUpdate = {};
    const jsToSql = {};

    expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrow(BadRequestError);
  });

});
