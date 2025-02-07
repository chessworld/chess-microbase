# Chess Microbase

Manages databases of chesss games.


## Development

### Setup

1. `docker-compose build`
2. `docker-compose run web rake db:setup`

### Running the app

```bash
docker-compose up
```

In browser use the following url:

> http://localhost:3000/


## Testing Facebook connect (??? is this still the process)

To test authentication with Facebook in development, the server needs to be made accessible via the internet. This can be done with [Ngrok](https://ngrok.com/)

1. Install and configure Ngrok
2. Run ngrok to local port with `ngrok tcp 3000`
3. Edit the value for the `FACEBOOK_CHANNEL_URL` environment variable to use the Ngrok assigned host and port in the URL
4. Edit the [Chess Microbase Dev Facebook App](https://developers.facebook.com/apps/xxx/settings/) and make sure its public URL and allowed domains are set to match the ngrok assigned hostname.
5. Restart the server and sign in with Facebook
this software and associated documentation files (the "Software"), to deal in
