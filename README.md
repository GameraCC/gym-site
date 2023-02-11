# gym-site

Work-In-Progress Gym site


https://user-images.githubusercontent.com/54292532/218234224-f7602679-edd6-4645-b1eb-b5610ec8eff2.mp4



https://user-images.githubusercontent.com/54292532/218234226-dcb50f36-d568-4f3f-8c37-0bb275050361.mp4


## CI / CD Tips

Utilize the following serverless methods to debug and deploy functions

> `serverless logs -f functionName -t`

This serverless function tails the logs of a given function for updates, continuously polling CloudWatch for updates, set this up in a split terminal alongside the next command for fast CI / CD

> `serverless deploy -f functionName`

This serverless function deploys only a specific function rather than the entire Cloudformation stack speeding up CI/CD 10 fold
