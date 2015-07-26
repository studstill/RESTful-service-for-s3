var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  username: {type: String, unique: true, match: /^[a-zA-Z0-9]+$/, required: 'username is required, only letters and numbers allowed'},
  files: [{type: mongoose.Schema.Types.ObjectId, ref: 'File'}]
});

module.exports = mongoose.model('User', userSchema);
