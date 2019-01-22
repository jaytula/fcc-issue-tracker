/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
var mongoose = require('mongoose')
var ObjectIdIsValid = mongoose.Types.ObjectId.isValid;

chai.use(chaiHttp);
let SAVEDID = false

suite('Functional Tests', function() {
  
    suite('POST /api/issues/{project} => object with issue data', function() {
      test('Every field filled in', function(done) {
       chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field filled in',
          assigned_to: 'Chai and Mocha',
          status_text: 'In QA'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          
          assert.equal(res.body.status, "success")
          assert.isTrue('issue_title' in res.body.data)
          assert.isTrue('_id' in res.body.data)
          assert.isTrue('created_on' in res.body.data)
          assert.isTrue('updated_on' in res.body.data)
          assert.isTrue('open' in res.body.data)
          assert.isTrue(ObjectIdIsValid(res.body.data._id))
          SAVEDID = res.body.data._id
          done();
        });
      });
      
      test('Required fields filled in', function(done) {
        chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title for Required only',
          issue_text: 'text for Required only',
          created_by: 'Functional Test - Required Only filled in',
        })
        .end(function(err, res){
          assert.equal(res.status, 200);

          assert.equal(res.body.status, "success")
          //assert.isTrue(ObjectIdIsValid(res.body.data)) 
         
          done();
        });
      });
      
      test('Missing required fields', function(done) {
        chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title for Required only',
          issue_text: 'text for Required only',
        })
        .end(function(err, res){
          assert.equal(res.status, 200);

          assert.equal(res.body.status, "fail") 
          assert.isTrue('created_by' in res.body.data)
         
          done();
        });
        
      });
      
    });
  
    suite('PUT /api/issues/{project} => text', function() {
      test('No body', function(done) {
        chai.request(server).put('/api/issues/test')
        .send({
          _id: SAVEDID
        })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.text, 'no updated field sent')
          done()
        })
        
      });

      
      test('One field to update', function(done) {
        chai.request(server).put('/api/issues/test')
        .send({
          _id: SAVEDID,
          created_by: 'luci'
        })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.text, 'successfully updated')
          done()
        })
      });

      test('Multiple fields to update', function(done) {
        chai.request(server).put('/api/issues/test')
        .send({
          _id: SAVEDID,
          created_by: 'lucille',
          issue_text: 'blunder bust'
        })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.equal(res.text, 'successfully updated')
          done()
        })
      });
      
    });
  
    suite('GET /api/issues/{project} => Array of objects with issue data', function() {
      let noFilterCount
      let oneFilterCount
      test('No filter', function(done) {
        chai.request(server)
        .get('/api/issues/test')
        .query({})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.property(res.body[0], 'assigned_to');
          assert.property(res.body[0], 'open');
          assert.property(res.body[0], 'status_text');
          assert.property(res.body[0], '_id');
          noFilterCount = res.body.length
          done();
        });
      });

      test('One filter', function(done) {
        chai.request(server)
        .get('/api/issues/test')
        .query({status_text: 'In QA'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.notEqual(res.body.length, noFilterCount)
          oneFilterCount = res.body.length
          done();
        });
        
      });
      
      test('Multiple filters (test for multiple fields you know will be in the db for a return)', function(done) {
        chai.request(server)
        .get('/api/issues/test')
        .query({status_text: 'In QA', open: 'false'})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.notEqual(res.body.length, oneFilterCount)
          oneFilterCount = res.body.length
          done();
        });
      });
      
    });
  
    suite('DELETE /api/issues/{project} => text', function() {
      test('No _id', function(done) {
        chai.request(server).delete('/api/issues/test')
        .send({
        })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.isTrue(/^_id error$/.test(res.text))
          done()
        })
      });

      test('Valid _id', (done) => {
        chai.request(server).delete('/api/issues/test')
        .send({
          _id: SAVEDID
        })
        .end((err, res) => {
          assert.equal(res.status, 200)
          assert.isTrue(/^deleted /.test(res.text))
          done()
        })
      });
      
   });

});
