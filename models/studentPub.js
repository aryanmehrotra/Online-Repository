var mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

var studentPublicationSchema = new mongoose.Schema({
    studentName: String,
    enrollmentNum: String,
    semester: String,
    program: String,
    category: String,
    authorName: String,
    publicationTitle: String,
    journalName: String,
    volumeNum: String,
    issueNum: String,
    pageNum: String,
    issnNum: String,
    indexing: String,
    createdBy: String
});

module.exports = mongoose.model("studentPub", studentPublicationSchema);