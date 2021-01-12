const app = require('../app.js')
const chaiHttp = require('chai-http')
const chai = require('chai')
const should = chai.should()

chai.use(chaiHttp)

describe('# app test start', () => {
	it('should return code 200', (done) => {
		// console.log('test success')
		chai.request(app)
			.get('/')
			.end((err, res) => {
				res.should.have.status(200)
				done()
			})
		// getIndex(req, res);
		// res.statasCode.should.be.equal(200);
	})
})