# kachery-resource-proxy

When a user hosts a Kachery resource ([kachery-resource](https://github.com/scratchrealm/kachery-resource/blob/main/README.md)), they configure the resource to connect with a proxy server (kachery-resource-proxy). The proxy server receives request from computers in a Kachery zone and forwards them to the resource. For example, if a lab wants to make a large number of files available in a Kachery zone, but only wants to upload files on demand as they are requested, then they would host a Kachery resource. Many resources can use the same proxy server, but they must all be in the same zone.

## Hosting a proxy server

This server is designed to run in the cloud on Heroku.

**Step 1: Create a new Heroku project**

Sign up for a [Heroku](https://heroku.com) account and Create a new app. Same it something like kachery-resource-proxy-example

**Step 2: Set up a proxy secret**

To permit only authorized resources to connect to your proxy server, you must set up a proxy secret.

In the Heroku web console, open the Settings for your project and add a Config Variable called `PROXY_SECRET`. For the value, use a random string of characters. This will be the secret you share with trusted users to allow them to connect their resources to your proxy server.

**Step 3: Clone and set up this repo**

Follow the instructions in the Heroku web console to install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and log in to Heroku from your computer. Then clone and set up this repo.

```bash
heroku login

git clone <this-repo>
cd kachery-resource-proxy

# replace with the name of your project
heroku git:remote -a kachery-resource-proxy-example
```

To deploy the server:

```bash
git push heroku main
```

Make a note of the URL where the server is being hosted. For example it might be `https://kachery-resource-proxy-example.herokuapp.com`. You will share this URL along with the proxy secret to allow users to connect their resources to your proxy server.