var mongoose = require('mongoose');
var fileSchema = mongoose.Schema({
  fileName: {type: String, required: 'fileName is required'},
  content: {type: String, required: 'file content is required'},
  url: String
});

module.exports = mongoose.model('File', fileSchema);
