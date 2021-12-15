// const validUrl = require('valid-url')
const urlModel = require('../models/urlModel')
const shortid = require('shortid')
const redis = require("redis");
const { promisify } = require("util")

const redisClient = redis.createClient(
    12212,
    "redis-12212.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("aE4ea7vhppPczbE1JjH6Ia50LAq42kqr", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});


const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);



const isValid = function (value) {
    if (typeof (value) === 'undefined' || typeof (value) === 'null') { return false } //if undefined or null occur rather than what we are expecting than this particular feild will be false.
    if (value.trim().length == 0) { return false } //if user give spaces not any string eg:- "  " =>here this value is empty, only space is there so after trim if it becomes empty than false will be given. 
    if (typeof (value) === 'string' && value.trim().length > 0) { return true } //to check only string is comming and after trim value should be their than only it will be true.
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const createurl = async function (req, res) {

    try {
        if (!isValidRequestBody(req.body)) {
            res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide URL details' })
            return
        }
        if (!isValid(req.body.longUrl)) {
            return res.status(400).send({ status: false, message: ' Please provide LONG URL' })
        }

        const longUrl = req.body.longUrl.trim()
        //console.log(longUrl)

        const validUrl = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i
        if (!(validUrl.test(longUrl))) {
            return res.status(400).send({ status: false, msg: "longurl is not valid" })
        }

        const baseUrl = 'http://localhost:3000'
        //---GENERATE URLCODE
        let urlCode = shortid.generate().match(/[a-z\A-Z]/g).join("") //---this will give only Alphabet
        urlCode=urlCode.toLowerCase()   //urlcode will be in lowercase

        //---FETCH THE DATA IN REDIS
        let checkforUrl = await GET_ASYNC(`${longUrl}`)
        if (checkforUrl) {
            console.log("line no66")
            return res.status(200).send({ status: true, "data": JSON.parse(checkforUrl) })
        }
        //---FETCH THE DATA IN MONGO DB IF IT IS NOT PRESENT IN CACHE
        let url = await urlModel.findOne({ longUrl })
        if (url) {
            return res.status(200).send({ status: true, "data": url }) //---if already exist
        }

        //---GENERATE DATA BY LONG URL
        const shortUrl = baseUrl + '/' + urlCode
        const urlData = { urlCode, longUrl, shortUrl }
        const newurl = await urlModel.create(urlData);
        //---SET GENERATE DATA IN CACHE
        await SET_ASYNC(`${longUrl}`, JSON.stringify(urlData))
        return res.status(201).send({ status: true, msg: `URL created successfully`, data: newurl });
    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, msg: 'Server Error' })
    }
}

const geturl = async function (req, res) {
    try {
        const urlCode = req.params.urlCode.trim().toLowerCase()
    
        if (!isValid(urlCode)) {
            res.status(400).send({ status: false, message: 'Please provide valid urlCode' })
        }

        let checkforUrl = await GET_ASYNC(`${urlCode}`)    //first check in cache
        if (checkforUrl) {
            return res.redirect(302, checkforUrl)
        }

        const url = await urlModel.findOne({ urlCode: urlCode })     //second check in Db
        if (!url) {
            return res.status(404).send({ status: false, message: 'No URL Found' })
        }
        await SET_ASYNC(`${urlCode}`, JSON.stringify(url.longUrl))     //if data found in db than created in cache
        return res.redirect(302, url.longUrl)

    } catch (err) {
        console.error(err)
        res.status(500).send('Server Error')
    }
}








// const geturl = async function (req, res) {
//     try {
//         const urlCode = req.params.urlCode.trim().toLowerCase() //accesing url code from params
//         if (!isValid(urlCode)) {
//             res.status(400).send({ status: false, message: 'Please provide valid urlCode' })
//         }

//         let checkforUrl = await GET_ASYNC(`${urlCode}`)
//         if (checkforUrl) {
//             console.log("hi")
//             let checkforUrl1 = JSON.parse(checkforUrl)
//             return res.redirect(302, checkforUrl1.longUrl)
//         }
//         const url = await urlModel.findOne({ urlCode: urlCode })

//         if (!url) {
//             return res.status(404).send({ status: false, message: 'No URL Found' })

//         }
//         await SET_ASYNC(`${urlCode}`, JSON.stringify(url))
//         return res.redirect(302, url.longUrl)

//     } catch (err) {
//         console.error(err)
//         res.status(500).send('Server Error')
//     }
// }






module.exports.geturl = geturl
module.exports.createurl = createurl

