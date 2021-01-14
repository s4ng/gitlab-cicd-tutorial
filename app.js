const express = require('express')
const app = express()
const port = 3000

app.use('/', express.static(`${__dirname}/src`))

const server = app.listen(port, () => {
	console.log('Server ON')
})

module.exports = server