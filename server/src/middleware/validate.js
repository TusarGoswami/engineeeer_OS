/**
 * Zod validation middleware factory
 * @param {Object} schemas - { body?: z.ZodSchema, query?: z.ZodSchema, params?: z.ZodSchema }
 */
export const validate = schemas => {
  return async (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validate;
