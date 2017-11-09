require('dotenv').config();
const express = require('express');
const validator = require('validator');
const dbConnection = require('./db/');

const app = express();

const requestedFields = ['src', 'dst', 'req'];
const validateQueryString = function(req, res, next) {
  let queryString = req.query;
  let candidateFields = [];
  Object.keys(queryString).forEach(key => {
    let field = validator.escape(decodeURIComponent(key).trim());
    let value = validator.escape(decodeURIComponent(queryString[key]).trim());
    delete queryString[key];
    queryString[field] = value;
    candidateFields.push(field);
  });
  if(Buffer.from(candidateFields).compare(Buffer.from(requestedFields)) !== 0) {
    const err = new Error('Bad request');
    let missing = requestedFields.filter((field, index) => field !== candidateFields[index]);
    err.status = 400;
    err.info = `missing field(s) ${missing.join(', ')}`;
    return res.json({status: err.status, reason: err.message, info: err.info})
  }
  return next();
}

app.set('port', process.env.PORT || 3000);
app.set('trust proxy', true);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/api/lang', (req, res, next) => {
  dbConnection.getConnection((err, connection) => {
    if(err) {
      console.log(err);
      return res.json({status: 500, reason: 'unexpected error please try again'});
    }
    connection.query('SHOW TABLES', (err, results, fields) => {
      if(err) {
        return res.json({status: 500, reason: 'unexpected error please try again'});
      }
      let languages = results.map(object => object[`Tables_in_${process.env.DB_NAME}`]);
      return res.json({status: 200, languages});
    });
  });
});

app.get('/api', validateQueryString, (req, res, next) => {
  const src = req.query.src;
  const dst = req.query.dst;
  const words = req.query.req.split(' ');
  dbConnection.getConnection((err, connection) => {
    if(err) {
      return res.json({status: 500, reason: 'unexpected error please try again'});
    }
    
    let order = '\n';
    words.forEach((word, index) => {
      order += `WHEN ${connection.escape(word)} THEN ${index + 1}\n`;
    });
    order += `END`;

    const sql = `
      SELECT ${connection.escapeId(src + '.word')} as src_words, ${connection.escapeId(dst + '.word')} as dst_words
      FROM ${connection.escapeId(src)}
      RIGHT JOIN ${connection.escapeId(dst)}
      ON ${connection.escapeId('id_' + dst)} = ${connection.escapeId('id_' + src)}
      HAVING src_words IN ?
      ORDER BY CASE src_words` + order;

    connection.query(sql, [[words]], (err, results, fields) => {
      if(err) {
        console.log(err);
        return res.json({status: 500, reason: 'unexpected error please try again'});
      }
      
      let data = {
        from: src,
        to: dst,
        origin: words.join(' '),
        translated: null
      }
      if(results && results.length) {
        data['translated'] = results.reduce((acc, curr, i) => {
          return acc + ` ${curr['dst_words']}`;
        },'');
      }
      connection.release();
      return res.json({status: 200, data});
    });
  });
})

app.listen(app.get('port'), () => {
  console.log(`\nServer running on: \nPORT: ${app.get('port')}\nENV: ${app.get('env')}\n`);
});
