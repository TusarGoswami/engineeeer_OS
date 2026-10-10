import { nanoid } from 'nanoid';

export const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = incomingId && typeof incomingId === 'string' ? incomingId : `req_${nanoid(16)}`;

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

export default requestIdMiddleware;
