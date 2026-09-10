const http = require('http');

const addData = JSON.stringify({ name: 'Test Habit Server' });

const optionsAdd = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/habits',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': addData.length
  }
};

const reqAdd = http.request(optionsAdd, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('ADD STATUS:', res.statusCode);
    console.log('ADD BODY:', body);
    
    // Now delete it
    const optionsDelete = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/habits/' + encodeURIComponent('Test Habit Server'),
      method: 'DELETE'
    };
    const reqDelete = http.request(optionsDelete, (resDel) => {
      let delBody = '';
      resDel.on('data', chunk => delBody += chunk);
      resDel.on('end', () => {
        console.log('DELETE STATUS:', resDel.statusCode);
        console.log('DELETE BODY:', delBody);
      });
    });
    reqDelete.end();
  });
});
reqAdd.write(addData);
reqAdd.end();
