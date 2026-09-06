# Running this on AWS

Overpass runs locally with free tools, but it's built the way a small
cloud-native service would be, so each piece has a direct AWS equivalent. The
scheduling logic and the API are the real work; the infrastructure under them is
swappable.

| Overpass (local) | AWS equivalent | Notes |
|------------------|----------------|-------|
| SQLite (default) | **Amazon RDS / Aurora (PostgreSQL)** | Already supported — set `DATABASE_URL`. Nothing else changes. |
| FastAPI (uvicorn) | **ECS Fargate** or **API Gateway + Lambda** | The same app as a container or a function. |
| JWT auth | **Amazon Cognito** | Cognito can issue the tokens; the API validates them the same way. |
| Static dashboard | **S3 + CloudFront**, or **Amplify Hosting** | The `next build` output is static; serve it behind a CDN. |
| Scheduled export / reschedule | **EventBridge + Lambda**, or **Step Functions** | Re-run the schedule on a timer or on demand. |
| Logs and metrics | **CloudWatch** | Structured logs, dashboards, and alarms on failed contacts or a station going offline. |
| CI/CD | **CodePipeline / CodeBuild** (or GitHub Actions) | Test on every change; deploy on green. |

## Scaling and resilience

The scheduler is stateless — it takes inputs and returns a plan — so it scales
horizontally behind a load balancer; nothing is pinned to one instance. Reads
recompute the schedule, which is cheap at this size and can be cached (e.g.
ElastiCache) or precomputed on a schedule if the fleet grows.

The resilience story is built in: a station going **offline** removes its passes,
and the next schedule automatically reassigns that work to other stations. That
same idea — recompute from current state rather than trusting stored results —
is what keeps the system correct when things change underneath it.
