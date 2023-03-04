var mysql = require('mysql');
var conn = mysql.createPool({
  host: 'localhost', // Replace with your host name
  user: 'root',      // Replace with your database username
  password: 'MySqL@dqn#y432!',      // Replace with your database password
  database: 'ssk' // // Replace with your database Name
}); 
conn.getConnection(function(err) {
  if (err) throw err;
  console.log('Database is connected successfully !');
});
module.exports = conn;