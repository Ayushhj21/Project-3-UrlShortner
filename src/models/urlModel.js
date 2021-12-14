const mongoose = require('mongoose');


const UrlSchema = new mongoose.Schema({
urlCode: { type: String, required: true, unique: true, lowercase:true, trim:true },
longUrl: { type: String, required: true},  //check in db if longurl exists or not
shortUrl: { type: String, required: true,unique:true},
}, { timestamps: true })
module.exports = mongoose.model('url', UrlSchema)


//{ urlCode: { mandatory, unique, lowercase, trim }, longUrl: {mandatory, valid url}, shortUrl: {mandatory, unique} }