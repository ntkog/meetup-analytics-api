# Meetup Analytics

DISCLAIMER: Project at very early stages. 


### Requirements

If you want to play with the data, you have to fetch it first, so please take a look to [Meetup Fetcher] before try to play with the API.

Once you retrieve some data from your Meetup communities, you're good to go!

### Get Started
First of all, we create a new folder and install the module inside of it:

```bash
$ mkdir ~/analytics ; cd ~/analytics
$ git clone https://github.com/ntkog/meetup-analytics-api.git .
$ npm install
```

Then create a folder called 'data', copy all json data previously fetched to that folder and put it in the root folder of the proyect ( If you follow the steps above, in 'analytics' folder)


```bash
$ mkdir -p ~/analytics/data
$ cp your_fetched_data/*.json ~/analytics/data/
```

Now, just run:

```bash
$ npm start
```

And you get an http server (express) running on localhost:3000 .

The base Endpoint is **/api**

## EndPoints

Just look at routes/api.js and you will see them. Please notice that all endPoints needs you send some JSON Body (stringified) via POST.

## Fields on body post requests

WARNING : It's kinda messy , i have to normalize it, probably you have to look into the code for which options can use in each endPoint.

- **communities** : (Optional) an Array of meetup urlnames . If you don't add it, it processes all communities you previously fetched in **'data'** folder.
- **filters** : Array of Objects. Every Object represents a filter to apply. They have the same format
```js
{
    "name" : ...,
    "params" : ...
}
```
-TODO : Explain custom endpoint options


[Meetup Fetcher]:https://github.com/ntkog/Meetup-fetcher