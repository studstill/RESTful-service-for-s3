var mongoose = require('mongoose');
var fileSchema = mongoose.Schema({
  fileName: String,
  content: String
});

module.exports = mongoose.model('File', fileSchema);
