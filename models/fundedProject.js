var mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

var fundedProjectSchema = new mongoose.Schema({
    namePrincipalInvestigator: String,
    nameCoInvestigator: String,
    title: String,
    fundingAgency: String,
    overallCost: String,
    startDate: String,
    EndDate: String
});

module.exports = mongoose.model("fundedProject", fundedProjectSchema);