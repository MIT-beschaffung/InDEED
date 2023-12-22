var express = require('express');
var http = require('http');

const api_key = 'NOT_FOUND';

var app = express();

app.use(express.json());

app.use(express.static(__dirname + '/../dist/bootstrap-test'));

app.use((req, res, next) => {
  res.append('Access-Control-Allow-Origin', '*');
  res.append('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.append('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.get('/api/searchProofById/:id', async (req, res) => {
  console.log('searchProofById ', req.params);

  const options = {
    hostname: '35.158.101.168',
    port: 9700,
    path: `/producer/${req.params.id}`,
    method: 'GET',
    headers: {
      'api_key': api_key
    }
  }

  const req2 = http.request(options, (res2) => {
    console.log(`STATUS: ${res2.statusCode}`);
    var data = '';
    res2.setEncoding('utf8');
    res2.on('data', (chunk) => {
      data += chunk;
    });
    res2.on('end', () => {
      console.log(`DATA: ${data}`);
      res.json(JSON.parse(data)).end();
    });
  });
  req2.on('error', (e) => {
    console.log(`ERROR: ${e.message}`);
    res.status(500).end();
  });
  req2.end();
});

app.get('/api/searchAggregatedData/:id', async (req, res) => {
  console.log('searchAggregatedData ', req.params);

  const options = {
    hostname: '35.158.101.168',
    port:9700,
    path: `/merkelize/${req.params.id}`,
    method: 'GET',
    headers: {
      'api_key': api_key
    }
  }

  const req2 = http.request(options, (res2) => {
    console.log(`STATUS: ${res2.statusCode}`);
    var data = '';
    res2.setEncoding('utf8');
    res2.on('data', (chunk) => {
      data += chunk;
    });
    res2.on('end', () => {
      console.log(`DATA: ${data}`);
      res.json(JSON.parse(data)).end();
    });
  });
  req2.on('error', (e) => {
    console.log(`ERROR: ${e.message}`);
    res.status(500).end();
  });
  req2.end();
});

app.get('/api/searchNotarizedData/:id', async (req, res) => {
  console.log('searchNotarizedData ', req.params);

  const options = {
    hostname: '35.158.101.168',
    port:9700,
    path: `/notarize/${req.params.id}`,
    method: 'GET',
    headers: {
      'api_key': api_key
    }
  }

  const req2 = http.request(options, (res2) => {
    console.log(`STATUS: ${res2.statusCode}`);
    var data = '';
    res2.setEncoding('utf8');
    res2.on('data', (chunk) => {
      data += chunk;
    });
    res2.on('end', () => {
      console.log(`DATA: ${data}`);
      res.json(JSON.parse(data)).end();
    });
  });
  req2.on('error', (e) => {
    console.log(`ERROR: ${e.message}`);
    res.status(500).end();
  });
  req2.end();
});

app.post('/api/logData', async (req, res) => {
  console.log('logData ', JSON.stringify(req.body));

  const options = {
    hostname: '35.158.101.168',
    port:9700,
    path: `/producer`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': api_key
    },
  }

  const req2 = http.request(options, (res2) => {
    console.log(`STATUS: ${res2.statusCode}`);
    var data = '';
    res2.setEncoding('utf8');
    res2.on('data', (chunk) => {
      data += chunk;
    });
    res2.on('end', () => {
      console.log(`DATA: ${data}`);
      res.json(JSON.parse(data)).end();
    });
  });
  req2.on('error', (e) => {
    console.log(`ERROR: ${e.message}`);
    res.status(500).end();
  });

  req2.write(JSON.stringify(req.body));

  req2.end();
});

app.post('/api/aggregateData', async (req, res) => {
  console.log('aggregateData ', JSON.stringify(req.body));

  const options = {
    hostname: '35.158.101.168',
    port:9700,
    path: `/merkelize/aggregateObjects`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': api_key
    },
  }

  const req2 = http.request(options, (res2) => {
    console.log(`STATUS: ${res2.statusCode}`);
    var data = '';
    res2.setEncoding('utf8');
    res2.on('data', (chunk) => {
      data += chunk;
    });

    res2.on('end', () => {
      console.log(`DATA: ${data}`);
      res.json(JSON.parse(data)).end();
    });
  });
  req2.on('error', (e) => {
    console.log(`ERROR: ${e.message}`);
    res.status(500).end();
  });

  req2.write(JSON.stringify(req.body));

  req2.end();
});
app.get('/*', async (request, response) => {
  response.sendFile('index.html', { root: __dirname + '/../dist/bootstrap-test'});
});

app.post('/api/notarizeData', async (req, res) => {
  console.log('notarizeData ', JSON.stringify(req.body));

  const options = {
    hostname: '35.158.101.168',
    port:9700,
    path: `/notarize/notarizeObjects`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': api_key
    },
  }

  const req2 = http.request(options, (res2) => {
    console.log(`STATUS: ${res2.statusCode}`);
    var data = '';
    res2.setEncoding('utf8');
    res2.on('data', (chunk) => {
      data += chunk;
    });

    res2.on('end', () => {
      console.log(`DATA: ${data}`);
      res.json(JSON.parse(data)).end();
    });
  });
  req2.on('error', (e) => {
    console.log(`ERROR: ${e.message}`);
    res.status(500).end();
  });

  req2.write(JSON.stringify(req.body));

  req2.end();
});

app.post('/api/verify', async (req, res) => {
  console.log('verify ', req);

  const options = {
    hostname: '35.158.101.168',
    port:9700,
    path: `/notarize/verifyNotarizationProof`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_key': api_key
    }
  }

  const req2 = http.request(options, (res2) => {
    console.log(`STATUS: ${res2.statusCode}`);
    var data = '';
    res2.setEncoding('utf8');
    res2.on('data', (chunk) => {
      data += chunk;
    });
    res2.on('end', () => {
      console.log(`DATA: ${data}`);
      res.json(JSON.parse(data)).end();
    });
  });

  req2.on('error', (e) => {
    console.log(`ERROR: ${e.message}`);
    res.status(500).end();
  });

  req2.write(JSON.stringify(req.body));

  req2.end();
});

app.get('/*', async (request, response) => {
  response.send("Test");
  //response.sendFile('index.html', { root: __dirname + '/../dist/bootstrap-test'});
});


app.listen(8000, () => console.log('Listening on port 8000'));
