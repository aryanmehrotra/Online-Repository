var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    School: String,
    Grade: String,
    WebOfScience: String,
    ScorpusId: String,
    GoogleScholarId: String,
    OrchidId: String,
    emailId: String,
    isAdmin: Boolean,
    notification: {
        type: Number,
        default: 0
    },

    // Assigned Set Target
    cntIntJournalass: {
        type: Number,
        default: 0
    },
    cntJournalass: {
        type: Number,
        default: 0
    },
    cntnewBookass: {
        type: Number,
        default: 0
    },
    cnteditBookass: {
        type: Number,
        default: 0
    },
    cntPatentass: {
        type: Number,
        default: 0
    },
    cntConfass: {
        type: Number,
        default: 0
    },
    cntIntConfass: {
        type: Number,
        default: 0
    },
    compcntIntJournalass: {
        type: Number,
        default: 0
    },
    compcntJournalass: {
        type: Number,
        default: 0
    },
    compcntnewBookass: {
        type: Number,
        default: 0
    },
    compcntIntConfass: {
        type: Number,
        default: 0
    },
    compcnteditBookass: {
        type: Number,
        default: 0
    },
    compcntPatentass: {
        type: Number,
        default: 0
    },
    compcntConfass: {
        type: Number,
        default: 0
    },

    // Local Set Target
    cntIntJournal: {
        type: Number,
        default: 0
    },
    cntPatent: {
        type: Number,
        default: 0
    },
    cntConf: {
        type: Number,
        default: 0
    },
    cntJournal: {
        type: Number,
        default: 0
    },
    cntnewBook: {
        type: Number,
        default: 0
    },
    cnteditBook: {
        type: Number,
        default: 0
    },
    cntIntConf: {
        type: Number,
        default: 0
    },
    compcntJournal: {
        type: Number,
        default: 0
    },
    compcntnewBook: {
        type: Number,
        default: 0
    },
    compcnteditBook: {
        type: Number,
        default: 0
    },
    compcntIntConf: {
        type: Number,
        default: 0
    },
    compcntIntJournal: {
        type: Number,
        default: 0
    },
    compcntPatent: {
        type: Number,
        default: 0
    },
    compcntConf: {
        type: Number,
        default: 0
    },


    studPublications: [ObjectId],
    publications: [ObjectId],
    fundProjects: [ObjectId],
    selfTargetass: [ObjectId],
    selfTarget: [ObjectId]

});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);