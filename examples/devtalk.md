* # Building Resilient APIs {logo: animdeck}
  * Design patterns that survive production
  * Ji Soo Yi
* ## The Problem
* What makes an API fragile?
  * ++ No input validation -- garbage in, crash out
  * ++ Missing error codes -- clients can't tell what went wrong
  * ++ No rate limiting -- one bad actor takes everyone down
  * ++ Synchronous everything -- one slow dependency blocks all requests
  * > "Distributed systems are hard. Make the failure modes explicit." -- unknown
* ## Validation
* Validate at the Boundary
  * Always validate **before** touching your database
  * ++ Check required fields
  * ++ Check types and ranges
  * ++ Return structured errors, not stack traces
  * ```json
    {
      "error": "VALIDATION_FAILED",
      "fields": {
        "email": "invalid format",
        "age": "must be >= 0"
      }
    }
    ```
* Request Validation with Zod
  * ```typescript
    import { z } from "zod"
    
    const CreateUserSchema = z.object({
      email: z.string().email(),
      age:   z.number().int().min(0).max(150),
      name:  z.string().min(1).max(100),
    })
    
    app.post("/users", (req, res) => {
      const result = CreateUserSchema.safeParse(req.body)
      if (!result.success) {
        return res.status(400).json({ errors: result.error.flatten() })
      }
      // result.data is fully typed and validated
    })
    ```
* ## Error Handling
* |vs| Status Codes vs Error Codes
  * HTTP status tells **what category** failed
  * 400 Bad Request
  * 401 Unauthorized
  * 404 Not Found
  * 429 Too Many Requests
  * ---
  * Error codes tell **exactly what** failed
  * `MISSING_FIELD`
  * `TOKEN_EXPIRED`
  * `RESOURCE_NOT_FOUND`
  * `RATE_LIMIT_EXCEEDED`
* ## Rate Limiting
* Protect Your API
  * ++ Set limits per user, not per IP
    * IPs can be shared (NAT, VPNs)
    * Users are the actual resource consumers
  * ++ Use a sliding window, not a fixed bucket
    * Fixed bucket allows burst at window boundary
  * ++ Return `Retry-After` header when rejecting
  * ```typescript
    import rateLimit from "express-rate-limit"
    
    const limiter = rateLimit({
      windowMs: 60 * 1000,   // 1 minute
      max: 100,              // 100 requests per window
      keyGenerator: (req) => req.user?.id ?? req.ip,
      standardHeaders: true, // Return RateLimit-* headers
    })
    ```
* ## Summary
* What We Covered
  * ++ Validate at the boundary -- never trust input
  * ++ Return structured errors -- clients need to handle them programmatically
  * ++ Rate limit by user, sliding window, with `Retry-After`
  * ++ Make failure modes explicit -- if a dep is down, say so clearly
  * [1] https://opensource.zalando.com/restful-api-guidelines/
