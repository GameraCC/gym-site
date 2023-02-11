# gym-site

Work-In-Progress Gym site

## CI / CD Tips

Utilize the following serverless methods to debug and deploy functions

> `serverless logs -f functionName -t`

This serverless function tails the logs of a given function for updates, continuously polling CloudWatch for updates, set this up in a split terminal alongside the next command for fast CI / CD

> `serverless deploy -f functionName`

This serverless function deploys only a specific function rather than the entire Cloudformation stack speeding up CI/CD 10 fold
