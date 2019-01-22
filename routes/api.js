/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;


const CONNECTION_STRING = process.env.DB; 
const FIELDNAMES = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'status_text']
let db;
let dbConnected = false

MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true}, async (err, client) => {
  if(err) throw err
  console.log('mongo client connected')
  db = client.db(process.env.DBNAME || 'my-db')
  try {
    let projects = await db.collection('issues').findOne({name: 'abba'})
    dbConnected = true
  } catch (err) {
    db = null
    console.log(`mongodb error: ${err.message}`)
  }
})

module.exports = function (app) {
  app.get('/api/ruthless', (req, res) => {
    res.send('farmers')
  })
  app.use('/api/issues/:project', (req, res, next) => {
    if(!dbConnected && false) return res.json({status: 'error', data: 'db connection problem'})
    next()
  })
  
  app.route('/api/issues/:project')
    // GET
    .get(async (req, res) => {
      let filterableFields = [...FIELDNAMES, 'open']
      let filter = Object.assign({}, req.query)

      Object.keys(filter).forEach(key => {
        if(filterableFields.indexOf(key) == -1) delete filter[key]
      })

      filter.project = req.params.project
      if(req.body.open && ['true', 'false'].indexOf(req.body.open) !== -1) {
        filter.open = req.body.open == 'true' ? true : false
      }

      let result = await db.collection('issues').find(filter).toArray()
      res.status(200).send(result)
    })

    // POST
    .post(async (req, res) => {
      let document = {project: req.params.project, open: true}
      let data = {}
      let missingProps = ['issue_title', 'issue_text', 'created_by'].reduce((acc, curr) => {
        return curr in req.body ? acc : [...acc, curr]
      }, [])

      if(missingProps.length) {
        missingProps.forEach(e => {
          data[e] = `'${e}' is required`
        })
        return res.json({status: 'fail', data})
      } 
      try {
        FIELDNAMES.forEach(item => {
          document[item] = (item in req.body) ? req.body[item] : ''
        })
        let date_created = new Date()
        document.created_on = date_created;
        document.updated_on = date_created;
        
        let result = await db.collection('issues').insertOne(document)
        return res.json({status: 'success', data: result.ops[0]})
      } catch(err) {
        console.log(err.message);
        return res.json({status: 'error', data: err.message})
      }
      res.json({status: 'success', data})
    })

    // PUT
    .put(async (req, res) => {
      var project = req.params.project;      
      if(!('_id' in req.body)) return res.send('no updated field sent')
      let _id = req.body._id
      let objectId
      try {
        objectId = ObjectId(req.body._id);
      } catch(err) {
        return res.send('could not update ' +_id)
      }
    
      let update = {}
      if(req.body.open && ['true', 'false'].indexOf(req.body.open) !== -1) {
        update.open = req.body.open == 'true' ? true : false
      }
    
      FIELDNAMES.forEach(name => {
        if(name in req.body && req.body[name]) update[name] = req.body[name]
      })
      if(!Object.keys(update).length) return res.send('no updated field sent')
    
      update.updated_on = new Date()
    
      let result = await db.collection('issues').findOneAndUpdate(
        {'_id': objectId},
        { $set: update }
      )
      if(!result.value) return res.send('could not update ' +_id)
      res.status(200).send('successfully updated')
    })

    // DELETE 
    .delete(async (req, res) => {
      var project = req.params.project;
      let _id = req.body._id
      if(!_id) return res.send('_id error')
      let objectId
      try {
        objectId = ObjectId(_id);
      } catch(err) {
        return res.send('could not delete ' + _id)
      }
    
      let result = await db.collection('issues').deleteOne({_id: objectId})
      res.send((result.deletedCount ? 'deleted ' : 'could not delete ') + _id)
    });
};
