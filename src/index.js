const express = require('express');
var bodyParser = require('body-parser');
const multer = require("multer")

const route = require('./routes/route.js');

const app = express();
app.use(multer().any())


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));




const mongoose = require('mongoose')

mongoose.connect("mongodb+srv://mashum:GfvbXkTb0tLmZhEU@cluster0.jo9tb.mongodb.net/group14Database?retryWrites=true&w=majority", {useNewUrlParser: true})
    .then(() => console.log('mongodb running on '))
    .catch(err => console.log(err))

    app.use('/', route);

app.listen(process.env.PORT || 3000, function() {
	console.log('Express app running on port ' + (process.env.PORT || 3000))
});


