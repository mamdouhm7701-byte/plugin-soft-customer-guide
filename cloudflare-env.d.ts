declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GUIDE_BOOTSTRAP_EMAIL?: string;
    GUIDE_BOOTSTRAP_TOKEN_HASH?: string;
    GUIDE_BOOTSTRAP_EXPIRES?: string;
    GUIDE_RATE_SECRET?: string;
  }
}
