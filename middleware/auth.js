"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError, BadRequestError, NotFoundError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Middleware to use when verifying logged-in user as admin
 * if not, raises Unauthorized.
 */

function verifyAdmin(req, res, next){
  try{
    const user = res.locals.user;
    // Throw Unauthorized error if not logged in user or not admin
    if (!user || !user.isAdmin){
      throw new UnauthorizedError();
    }
    return next();
  } catch (err) {
    return next(err)
  }
}

/**
 * Middleware to use when verifying user or admin status of user
 * if not, raises Unauthorized.
 */

function verifyUserOrAdmin(req, res, next){
  try{
    const user = res.locals.user;
    // Throw Unauthorized error if not logged in, or if neither the correct user nor an admin
    if (!(user && (user.username === req.params.username || user.isAdmin )) ) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (err) {
    return next(err);
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  verifyAdmin,
  verifyUserOrAdmin,
};
