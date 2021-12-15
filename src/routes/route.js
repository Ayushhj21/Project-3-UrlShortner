const express = require('express');
const router = express.Router();

const urlController = require("../controllers/urlController")

router.post('/url/shorten', urlController.createurl)
router.get('/:urlCode', urlController.geturl)





module.exports = router;