const validUrl = require('valid-url')
const shortid = require('shortid')

const urlModel = require('../models/urlModel')


const isValid = function (value) {
    if (typeof (value) === 'undefined' || typeof (value) === 'null') { return false } //if undefined or null occur rather than what we are expecting than this particular feild will be false.
    if (value.trim().length == 0) { return false } //if user give spaces not any string eg:- "  " =>here this value is empty, only space is there so after trim if it becomes empty than false will be given. 
    if (typeof (value) === 'string' && value.trim().length > 0) { return true } //to check only string is comming and after trim value should be their than only it will be true.
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const shortnerUrl = async function (req, res) {
    try {
        if (!isValidRequestBody(req.body)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide URL details' })
            return
        }
        if (!isValid(req.body.longUrl)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide URL' })
        }

        const longUrl = req.body.longUrl.trim()
        const validUrl = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/;
        if (!(longUrl.match(validUrl))) {
            return res.status(400).send({ status: false, msg: "longurl is not valid" })
        }

        const baseUrl = 'http://localhost:3000'
        //generating random string
        let urlCode = shortid.generate().match(/[a-z\A-Z]/g).join("")     //this will give only Alphabet

        let url = await urlModel.findOne({ longUrl })
        if (url) {
            return res.status(200).send({ status: true, "data": url }) //if already exist
        }
        //if new longUrl is there
        const shortUrl = baseUrl + '/' + urlCode
        const urlData = { urlCode, longUrl, shortUrl }
        const newurl = await urlModel.create(urlData);
        return res.status(201).send({ status: true, msg: `URL created successfully`, data: newurl });

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, msg: 'Server Error' })
    }
}



const geturl = async function (req, res) {
    try {
        const urlCode = req.params.urlCode.trim()
        console.log(urlCode)
        if (!isValid(urlCode)) {
            res.status(400).send({ status: false, message: 'Please provide valid urlCode' }) //check this
        }
        const url = await urlModel.findOne({ urlCode: urlCode })
        if (url) {
           return res.redirect(302, url.longUrl)
        }  
        return res.status(404).send({ status: false, message:'No URL Found'})

    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
}






module.exports.shortnerUrl = shortnerUrl
module.exports.geturl = geturl
