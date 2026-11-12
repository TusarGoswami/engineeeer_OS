# EngineerOS Production Deployment Checklist

## 1. Secrets & Credentials
- [ ] Set high-entropy random strings for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
- [ ] Configure `COOKIE_SECRET` for signed HTTP-only cookies.
- [ ] Restrict MongoDB Atlas IP whitelist to production Kubernetes / VPC CIDR block.

## 2. Infrastructure & Caching
- [ ] Deploy managed Redis (v7+) cluster with persistence enabled for rate limiting.
- [ ] Configure Docker multi-stage build caching with unprivileged `node` user.
- [ ] Verify `/healthz` and `/readyz` liveness and readiness probe timeouts.

## 3. Network & Security
- [ ] Verify SSL termination at reverse proxy (Cloudflare / Nginx).
- [ ] Ensure `CLIENT_URL` matches canonical domain with HTTPS protocol.
- [ ] Run automated vulnerability audit with `npm audit --production`.
