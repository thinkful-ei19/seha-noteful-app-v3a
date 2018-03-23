'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');


const Tag = require('../models/tag');
const seedTags = require('../db/seed/tags');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Tags', function () {
  before(function () {
    return mongoose.connect(TEST_MONGODB_URI);
  });

  beforeEach(function () {
    return Tag.insertMany(seedTags)
      .then(() => Tag.createIndexes());
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('GET /api/tags', function () {

    it('should return the correct number of tags', function () {
      const dbPromise = Tag.find();
      const apiPromise = chai.request(app).get('/api/tags');

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });



    it('should return correct fields', function () {

      const dbPromise = Tag.find();
      const apiPromise = chai.request(app).get('/api/tags');

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
          res.body.forEach(function (item) {
            expect(item).to.be.a('object');
            expect(item).to.have.keys('id', 'name');
          });

        });
    });
  });
  describe('GET /api/tags/:id', function () {

    it('should return correct notes with a valid id', function () {
      let data;
      return Tag
        .findOne()
        .then(_data => {
          data = _data;
          return chai.request(app).get(`/api/tags/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'name');
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
        });
    });

    it('should respond with a 400 for an invalid id', function () {
      const badId = '99-99-99';

      return chai.request(app)
        .get(`/api/tags/${badId}`)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });

    it('should respond with a 404 for invalid id', function () {

      return chai.request(app)
        .get('/api/tags/AAAAAAAAAAAAAAAAAAAAAAAA')
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(404);
        });
    });
  });
  describe('POST /api/tags', function () {

    it('should create and return a new item with valid data', function () {
      const newItem = {
        'name': 'Valid'
      };
      let body;
      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .then(function (res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('id', 'name');
          return Tag.findById(body.id);
        })
        .then(data => {
          expect(body.name).to.equal(data.name);
        });
    });
    it('should return an error when missing "name" field', function () {
      const newItem = {
        'bar': 'biz'
      };

      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('Missing `name` in request body');
        });
    });
    it('should return an error when given a duplicate name', function () {
      const newItem = {
        'name': 'baz'
      };

      return chai.request(app)
        .post('/api/tags')
        .send(newItem)
        .catch(err => err.response)
        .then(res => {

          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body.message).to.equal('The folder name already exists');
        });
    });

  });
  describe('PUT /api/tags/:id', function () {
    it('should respond with a 400 for improperly formatted id', function () {
      const updateItem = {
        'name': 'What about dogs?!'
      };
      const badId = '99-99-99';

      return chai.request(app)
        .put(`/api/tags/${badId}`)
        .send(updateItem)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The `id` is not valid');
        });
    });


  });
  describe('DELETE /api/tags/:id', function () {

    it('should delete an item by id', function () {
      let data;
      return Tag.findOne().select('id name')
        .then(_data => {
          data = _data;
          return chai.request(app).delete(`/api/tags/${data.id}`);
        })
        .then(function (res) {
          expect(res).to.have.status(204);
        });
    });

  });

}); 