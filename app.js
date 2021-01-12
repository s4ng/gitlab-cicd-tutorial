const express = require('express')
const path = require('path')
const app = express()
const port = 3000

const getIndex = (req, res) => {
	res.sendFile(path.join(`${__dirname}/src/index.html`))
}

app.get('/', getIndex)

const server = app.listen(port, () => {
	console.log('Server ON')
})

module.exports = server