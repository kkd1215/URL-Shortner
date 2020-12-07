const express = require('express');
const shortId = require('shortid');
const mongoose = require('mongoose');
const createHttpErrors = require('http-errors');
const path = require('path');
const ShortUrl = require('./models/url_model');
require('dotenv').config()

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.set('view engine', 'ejs');

mongoose
  .connect(process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB connected...'))
  .catch((e) => console.log('Error Connecting...'));


app.get('/', async (req, res, next) => {
  res.render('index');
});

app.post('/', async (req, res, next) => {
  try {
    let { url, slug } = req.body;

    if (typeof slug == "undefined" || slug == null || slug == "") {
      slug = shortId.generate();
    }

    if(!url) {
      throw createHttpErrors.BadRequest('Provide a valid Url');
    }

    const urlExists = await ShortUrl.findOne({url});

    if(urlExists) {
      res.render('index', {short_url: `https://kdsh.herokuapp.com/${urlExists.shortid}`});
      return;
    }

    const shortUrl = new ShortUrl({url: url, shortid: slug});
    const result = await shortUrl.save();
    res.render('index', {short_url: `https://kdsh.herokuapp.com/${result.shortid}`});

  } catch (e) {
    next(e);
  }
});

app.get('/:shortId', async (req, res, next) => {
  try {
    const { shortId } = req.params;
    const result = await ShortUrl.findOne({ shortid: shortId });
    if(!result) {
      throw createHttpErrors.NotFound('Short Url does not exist');
    }
    res.redirect(result.url);
  } catch (e) {
    next(e);
  }
});


app.use((req, res, next) => {
  next(createHttpErrors.NotFound());
});

app.use((e, req, res, next) => {
  res.status(e.status || 500);
  res.render('index', {error: e.message})
});


app.listen(PORT, () => { console.log(`Port running on ${PORT}`) });
