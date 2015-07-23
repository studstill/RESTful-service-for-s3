var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  username: {type: String, unique: true, required: 'username is required'},
  files: [{type: mongoose.Schema.Types.ObjectId, ref: 'File'}]
});

module.exports = mongoose.model('User', userSchema);
