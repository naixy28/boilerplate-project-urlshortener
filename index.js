require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns')
const app = express();
const bodyParser = require('body-parser')

const promisefy = (fn) => {
  const func = (...args) => {
    return new Promise((res,rej) => {
      fn(...args, (err, ...data) => {
        if (err) {
          rej(err)
        } else {
          res(...data)
        }
      })
    })
  }
  return func
}
const lookup = promisefy(dns.lookup)

const isValidUrl = async (url) => {
  try {
    const hostname = new URL(url).hostname
    const addData = await lookup(hostname)
    console.log(addData)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

// Basic Configuration
const port = process.env.PORT || 3000;

const urlMap = new Map()
const reverseMap = new Map()

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req, res) => {
  const {url} = req.body
  // isValid url?
  let isValid = await isValidUrl(url)
  
  if (!isValid) {
    return res.json({ error: 'invalid url' })
  }
  // create mapping
  let shortUrl = ''
  if (urlMap.has(url)) {
    shortUrl = urlMap.get(url)
  } else {
    shortUrl = urlMap.size + 1
    urlMap.set(url, shortUrl.toString()) 
    reverseMap.set(shortUrl.toString(), url)
  }

  console.log(urlMap, reverseMap)
  res.json({original_url : url, short_url : shortUrl})

})

app.get('/api/shorturl/:shortUrl', function(req, res) {
  const {shortUrl} = req.params
  console.log(shortUrl.toString())
  if (reverseMap.has(shortUrl)) {
    const originalUrl = reverseMap.get(shortUrl)
    if (!originalUrl.startsWith('http')) {
      res.redirect(`http://${originalUrl}`)
    } else {
      res.redirect(originalUrl)
    }
  } else {
    res.status(404).json({error: 'not exist'})
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
