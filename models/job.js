"use strict";

const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
/** Creates a job, updates the db, and returns the new job data.
   *
   * data = { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   **/

static async create(data) {
    const result = await db.query(
          `INSERT INTO jobs (title,
                             salary,
                             equity,
                             company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          data.title,
          data.salary,
          data.equity,
          data.companyHandle,
        ]);
    let job = result.rows[0];

    return job;
  }

  /** Finds all jobs with optional user-assigned filters
   *
   * searchFilters:
   *    title (case-insensitive, partial matching)
   *    minSalary
   *    hasEquity (returns true for jobs with positive equity)
   *
   * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
   * */

  static async findAll({ minSalary, hasEquity, title } = {}) {
    let baseQuery = `SELECT j.id,
                        j.title,
                        j.salary,
                        j.equity,
                        j.company_handle AS "companyHandle",
                        c.name AS "companyName"
                    FROM jobs j 
                    LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    let whereExpressions = [];
    let queryValues = [];

    // Filter terms are added to whereExpressions and queryValues by selection so correct database query can be made
    if (title !== undefined) {
        queryValues.push(`%${title}%`);
        whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`salary >= $${queryValues.length}`);
    }

    if (hasEquity === true) {
      whereExpressions.push(`equity > 0`);
    }

    if (whereExpressions.length > 0) {
      baseQuery += " WHERE " + whereExpressions.join(" AND ");
    }

   // Make query based on all avaiable filter parameters and return query results

    baseQuery += " ORDER BY title";
    const results = await db.query(baseQuery, queryValues);
    return results.rows;
  }

  /** Given an id, returns job data.
   *
   * Returns { id, title, salary, equity, companyHandle, company }
   *   where company is { handle, name, description, numEmployees, logoUrl }
   *
   * Throws NotFoundError if job is not found.
   **/

  static async get(id) {
    const query = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);

    const job = query.rows[0];

    if (!job) {
        throw new NotFoundError(`No job found with id: ${id}`);
    }

    const results = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`, [job.companyHandle]);

    delete job.companyHandle;
    job.company = results.rows[0];

    return job;
  }

  /** Partial Update of job data.
   *
   * Data may include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not job cannot be found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate( data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) {
        throw new NotFoundError(`No job found with id: ${id}`);
    }

    return job;
  }

  /** 
   * Deletes job from database given an id; returns undefined.
   * Throws NotFoundError if company cannot be found in db query.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`, [id]);
    const job = result.rows[0];

    if (!job) {
        throw new NotFoundError(`No job found with id: ${id}`);
    }
  }

};

module.exports = Job;