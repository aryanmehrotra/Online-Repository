var mongoose = require('mongoose');
var setTargetSchema = new mongoose.Schema({
    category_set_trgt: String,
    title_set_trgt: String,
    indexing: String,
    achievement_date_set_trgt: Date,
    assigned_by: String,
    assigned_to: String,
    completed: Boolean,
});

module.exports = mongoose.model("targetDetails", setTargetSchema);