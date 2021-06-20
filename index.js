const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require("passport-local");
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const {
    parse
} = require('json2csv');
const publicationDetails = require('./models/publications');
const targetDetails = require('./models/setTarget');
const User = require('./models/user');
const studentPublicationDetails = require('./models/studentPub')
const fundedProject = require('./models/fundedProject.js');
const studentPub = require('./models/studentPub');
const e = require('express');
const setTarget = require('./models/setTarget');


mongoose.connect("mongodb://localhost/researchApp", {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
});





app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(fileUpload());
//Setting View Engine
// app.use(expressLayout)
app.use(express.static(__dirname + '/public'));
app.use('/file', express.static(__dirname + '/public/uploads'));
app.set('view engine', 'ejs')

//Passport Configuration
app.use(require('express-session')({
    secret: "Coding till infinity",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());

app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
})

var currentDateTime = new Date();

//Routes


// Login Page
app.get('/', function(req, res) {
    if (req.user) {
        if (req.user.isAdmin == 1) {
            res.redirect(301, '/admlogin')
        } else {
            res.redirect(301, '/login')
        }
    } else {
        res.render('home');
    }
})

//PUBLICATION 
app.get("/publication", async function(req, res) {

    if (req.user.isAdmin != 1) {
        try {
            let publications = []
            let notification = [];

            for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
                let pub = await setTarget.findById(req.user.selfTargetass[i]);
                if (pub) {
                    notification.push(pub)
                }
            }





            for (let i = 0; i < req.user.publications.length; i++) {
                let pub = await publicationDetails.findById(req.user.publications[i]);
                if (pub) {
                    publications.push(pub);
                }
            }



            req.user.publications = publications;


            res.render("papers", {
                rPapers: publications,
                username: req.user._id,
                currentUser: req.user.firstName,
                lastName: req.user.lastName,
                School: req.user.School,
                WebOfScience: req.user.WebOfScience,
                ScorpusId: req.user.ScorpusId,
                GoogleScholarId: req.user.GoogleScholarId,
                OrchidId: req.user.OrchidId,
                notify: notification,


            });





        } catch (err) {
            console.log(err);
        }
    }
});

app.get("/admpublication", async function(req, res) {

    // Pass All publications
    let notification = [];

    for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
        let pub = await setTarget.findById(req.user.selfTargetass[i]);
        if (pub) {
            notification.push(pub)
        }
    }


    await publicationDetails.find({}, function(err, targets) {
        if (err) {
            console.log(err);
        } else {
            target = targets;
        }
    });

    // res.json(target);
    res.render("admpapers", {
        rPapers: target,
        currentUser: req.user.firstName,
        lastName: req.user.lastName,
        School: req.user.School,
        WebOfScience: req.user.WebOfScience,
        ScorpusId: req.user.ScorpusId,
        GoogleScholarId: req.user.GoogleScholarId,
        OrchidId: req.user.OrchidId,
        notify: notification,

    });


});

app.post("/admpublication", async function(req, res) {

    var category = req.body.category;
    var pubyear = req.body.pubyear;


    await publicationDetails.find({}, function(err, targets) {
        if (err) {
            console.log(err);
        } else {
            target = targets;
        }
    });

    try {


        for (let i = 0; i < target.length; i++) {
            // let y = target[i].pubDate.slice(11, 15);
            let y;
            if (target[i].pubDate) {
                y = target[i].pubDate.getFullYear()
                y = y.toString();
            }
            if (target[i].Category == category && y == pubyear) {

                publications.push(target[i]);
            } else if (category == 'all' && pubyear == 'all') {
                publications = target
                break;
            }
        }

        let fields = ['Category', 'author', 'title', 'journal_name', 'publication_title', 'volume_number', 'issue_number', 'page_number', 'issn_number', 'pindexing'];
        let opts = {
            fields
        };

        try {
            let csv = parse(publications, opts);

            res.set('Content-Type', 'text/csv');
            res.setHeader('Content-disposition', 'attachment; filename=publications.csv');
            res.status(200).send(csv);
            publications = []
            target = []
        } catch (err) {
            console.error(err);
        }


    } catch (err) {
        console.log(err);
    }



})

app.get('/publication/download/:path', async function(req, res) {
    let p = req.params.path;
    const file = `${__dirname}/public/uploads/` + p;
    res.download(file); // Set disposition and send it.
});



app.post("/publication", function(req, res) {
    var Category = req.body.category;
    var title = req.body.title;
    var journal_name = req.body.journal_name;
    var publication_title = req.body.publication_title;
    var volume_number = req.body.volume_number;
    var issue_number = req.body.issue_number;
    var page_number = req.body.page_number;
    var issn_number = req.body.issn_number;
    var pindexing = req.body.pindexing;
    var pubDate = req.body.pubDate;

    let users = req.body.author.split(',');

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.pubfile;

    // Use the mv() method to place the file somewhere on your server
    let path = Category + title + Date.now() + sampleFile.name;
    sampleFile.mv(__dirname + '/public/uploads/' + path, function(err) {
        if (err)
            return res.status(500).send(err);

        console.log(path);
    });

    var newPublication = {
        Category: Category,
        title: title,
        journal_name: journal_name,
        publication_title: publication_title,
        volume_number: volume_number,
        issue_number: issue_number,
        page_number: page_number,
        issn_number: issn_number,
        pindexing: pindexing,
        fileURI: path,
        pubDate: pubDate,
        createdBy: req.user._id

    }
    publicationDetails.create(newPublication, async function(err, newPublication) {
        if (err) {
            console.log(err);
        } else {
            //redirect back to the research papers Page
            var author = '';
            for (let i = 0; i < users.length; i++) {
                let user = await User.findOne({
                    username: users[i].trim()
                }).exec();
                console.log(user);
                if (user) {
                    user.publications.push(newPublication._id);
                    console.log(user);
                    await user.save();
                    if (i === users.length - 1) {
                        author = author + users[i] + '-' + user.firstName + ' ' + user.lastName
                    } else {
                        author = author + users[i] + '-' + user.firstName + ' ' + user.lastName + ','
                    }

                } else {
                    if (i === users.length - 1) {
                        author = author + users[i];
                    } else {
                        author = author + users[i] + ',';
                    }


                }
            }
            newPublication.author = author;
            await newPublication.save();
            res.redirect("/publication");
        }
    })

})
app.get("/publication/new", async function(req, res) {
    let notification = [];

    for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
        let pub = await setTarget.findById(req.user.selfTargetass[i]);
        if (pub) {
            notification.push(pub)
        }
    }

    res.render("newPublication", {
        currentUser: req.user.firstName,
        username: req.user.username,
        grade: req.user.Grade,
        lastName: req.user.lastName,
        School: req.user.School,
        WebOfScience: req.user.WebOfScience,
        ScorpusId: req.user.ScorpusId,
        GoogleScholarId: req.user.GoogleScholarId,
        OrchidId: req.user.OrchidId,
        notify: notification,

    });
})
app.get("/publication/edit", async function(req, res) {
    console.log("Edit Profile")
    let publication = await publicationDetails.findById(req.query.puid)
    let notification = [];

    for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
        let pub = await setTarget.findById(req.user.selfTargetass[i]);
        if (pub) {
            notification.push(pub)
        }
    }


    res.render("editPublication", {
        currentUser: req.user.firstName,
        username: req.user.username,
        grade: req.user.Grade,
        lastName: req.user.lastName,
        School: req.user.School,
        WebOfScience: req.user.WebOfScience,
        ScorpusId: req.user.ScorpusId,
        GoogleScholarId: req.user.GoogleScholarId,
        OrchidId: req.user.OrchidId,
        notify: notification,
        author: publication.author,
        publication_title: publication.publication_title,
        journal_name: publication.journal_name,
        volume_number: publication.volume_number,
        issue_number: publication.issue_number,
        page_number: publication.page_number,
        issn_number: publication.issn_number,
        pindexing: publication.pindexing,
        pubid: publication._id,

    });
})
app.post('/publication/edit', async function(req, res) {
    updatepubRecord(req, res);
    res.redirect('/publication');

});


function updatepubRecord(req, res) {
    publicationDetails.findOne({
        _id: req.body.pubid
    }, (err, pub) => {
        //this will give you the document what you want to update.. then 
        pub.author = req.body.author;
        pub.publication_title = req.body.publication_title;
        pub.journal_name = req.body.journal_name;
        pub.volume_number = req.body.volume_number;
        pub.issue_number = req.body.issue_number;
        pub.page_number = req.body.page_number;
        pub.issn_number = req.body.issn_number;
        pub.pindexing = req.body.pindexing;
        // then save that document
        pub.save();

    });

}

app.get('/publication/delete/:id', async function(req, res) {
    let pub = await publicationDetails.findById(req.params.id);
    console.log(pub);
    let p = pub.fileURI;
    const file = `${__dirname}/public/uploads/` + p;

    try {
        fs.unlinkSync(file);
        console.log('successfully deleted ');
    } catch (err) {
        // handle the error
        console.log(err);
    }

    if (req.user.isAdmin == 1 || pub.createdBy == req.user._id) {
        await pub.deleteOne();
    }
    res.redirect('/publication');
});


// Publication Ends

// Profile
app.get("/profile", function(req, res) {
    res.render("profile");

})
app.get("/profile/edit", async function(req, res) {
    let notification = [];

    for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
        let pub = await setTarget.findById(req.user.selfTargetass[i]);
        if (pub) {
            notification.push(pub)
        }
    }

    res.render("edit_profile", {
        currentUser: req.user.firstName,
        username: req.user.username,
        grade: req.user.Grade,
        lastName: req.user.lastName,
        School: req.user.School,
        WebOfScience: req.user.WebOfScience,
        ScorpusId: req.user.ScorpusId,
        GoogleScholarId: req.user.GoogleScholarId,
        OrchidId: req.user.OrchidId,
        notify: notification,

    });
});


// 
app.post('/profile/edit', async function(req, res) {
    updateRecord(req, res);
    res.redirect('/login');

});

function updateRecord(req, res) {
    User.findOne({
        _id: req.user._id
    }, (err, user) => {
        //this will give you the document what you want to update.. then 
        user.ScorpusId = req.body.ScorpusId;
        user.OrchidId = req.body.OrchidId;
        user.GoogleScholarId = req.body.GoogleScholarId;
        user.WebOfScience = req.body.WebOfScience; //so on and so forth

        // then save that document
        user.save();

    });

}
// 



//SET TARGET
app.get("/settarget", async function(req, res) {

    if (req.user.isAdmin != 1) {
        try {
            let target = []
            let targetass = []
            let notification = [];

            for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
                let pub = await setTarget.findById(req.user.selfTargetass[i]);
                if (pub) {
                    notification.push(pub)
                }
            }

            for (let i = 0; i < req.user.selfTarget.length; i++) {
                let pub = await targetDetails.findById(req.user.selfTarget[i]);
                if (pub) {
                    target.push(pub);
                }
            }
            // if (pub.createdBy == req.user._id) {
            //     canDelete.push(true);
            // } else {
            //     canDelete.push(false);
            // }
            req.user.selfTarget = target;

            for (let i = 0; i < req.user.selfTargetass.length; i++) {
                let pub = await targetDetails.findById(req.user.selfTargetass[i]);
                if (pub) {
                    target.push(pub);
                    targetass.push(pub);
                }
            }
            req.user.selfTargetass = targetass;


            res.render("targetDetails", {
                setTarget: target,
                notify: notification,
                currentUser: req.user.firstName,
                lastName: req.user.lastName,
                School: req.user.School,
                WebOfScience: req.user.WebOfScience,
                ScorpusId: req.user.ScorpusId,
                GoogleScholarId: req.user.GoogleScholarId,
                OrchidId: req.user.OrchidId

            });


        } catch (err) {
            console.log(err);
        }
    } else {
        await targetDetails.find({}, function(err, result) {
            if (err) {
                console.log(err);
            } else {
                target = result;
            }
        });
        let notification = [];

        for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
            let pub = await setTarget.findById(req.user.selfTargetass[i]);
            if (pub) {
                notification.push(pub)
            }
        }
        res.render("admtargetDetails", {
            setTarget: target,
            notify: notification,
            currentUser: req.user.firstName,
            lastName: req.user.lastName,
            School: req.user.School,
            WebOfScience: req.user.WebOfScience,
            ScorpusId: req.user.ScorpusId,
            GoogleScholarId: req.user.GoogleScholarId,
            OrchidId: req.user.OrchidId

        });
    }


});



app.post("/settarget", async function(req, res) {
    if (req.user.isAdmin != 1) {
        var category_set_trgt = req.body.category_set_trgt;
        var title_set_trgt = req.body.title_set_trgt;
        var indexing = req.body.indexing_set_trgt;
        var achievement_date_set_trgt = req.body.achievement_date_set_trgt;
        var assigned_by = req.user.username;
        var assigned_to = req.user.username;
        var completed = 0;

        // cntIntJournalass: Number,
        // cntPatentass: Number,
        // cntConfass: Number,

        var newTarget = {
            category_set_trgt: category_set_trgt,
            title_set_trgt: title_set_trgt,
            indexing: indexing,
            achievement_date_set_trgt: achievement_date_set_trgt,
            assigned_by: assigned_by,
            assigned_to: assigned_to,
            completed: completed

        }

        updatetarget(req, res);

        function updatetarget(req, res) {
            User.findOne({
                _id: req.user._id
            }, (err, pub) => {
                //this will give you the document what you want to update.. then 


                if (category_set_trgt == "International Journal") {
                    pub.cntIntJournal += 1;
                    console.log(pub.cntIntJournal)
                } else if (category_set_trgt == "Patent") {
                    pub.cntPatent += 1;
                } else if (category_set_trgt == "National Conference") {
                    pub.cntConf += 1;
                } else if (category_set_trgt == "National Journal") {
                    pub.cntJournal += 1;
                } else if (category_set_trgt == "Book Chapter") {
                    pub.cntnewBook += 1;
                } else if (category_set_trgt == "Edited Book") {
                    pub.cnteditBook += 1;
                } else if (category_set_trgt == "International Conference") {
                    pub.cntIntConf += 1;
                }
                // then save that document
                pub.save();
            });

        }


        targetDetails.create(newTarget, async function(err, newTarget) {
            if (err) {
                console.log(err);
            } else {

                User.findOne({
                    _id: req.user._id
                }, async(err, user) => {
                    //this will give you the document what you want to update.. then 
                    user.selfTarget.push(newTarget._id);

                    // then save that document
                    await user.save();

                });
                res.redirect("/settarget/new");
            }
        })
    } else {
        var category_set_trgt = req.body.category_set_trgt;
        var title_set_trgt = req.body.title_set_trgt;
        var indexing = req.body.indexing_set_trgt;
        var achievement_date_set_trgt = req.body.achievement_date_set_trgt;
        var assigned_by = req.user.username;
        var assigned_to = req.body.assigned_to;
        var completed = 0;


        // cntIntJournalass: Number,
        // cntPatentass: Number,
        // cntConfass: Number,

        var newTarget = {
            category_set_trgt: category_set_trgt,
            title_set_trgt: title_set_trgt,
            indexing: indexing,
            achievement_date_set_trgt: achievement_date_set_trgt,
            assigned_by: assigned_by,
            assigned_to: assigned_to,
            completed: completed

        }
        let user = await User.findOne({
            username: assigned_to
        }).exec();

        updatetarget(req, res);

        async function updatetarget(req, res) {


            User.findOne({
                _id: user._id
            }, async(err, pub) => {
                //this will give you the document what you want to update.. then 
                pub.notification += 1;
                if (category_set_trgt == "International Journal") {
                    pub.cntIntJournalass += 1;
                } else if (category_set_trgt == "Patent") {
                    pub.cntPatentass += 1;
                } else if (category_set_trgt == "National Conference") {
                    pub.cntConfass += 1;
                } else if (category_set_trgt == "National Journal") {
                    pub.cntJournalass += 1;
                } else if (category_set_trgt == "Book Chapter") {
                    pub.cntnewBookass += 1;
                } else if (category_set_trgt == "Edited Book") {
                    pub.cnteditBookass += 1;
                } else if (category_set_trgt == "International Conference") {
                    pub.cntIntConfass += 1;
                }

                // then save that document
                await pub.save();
            });

        }


        targetDetails.create(newTarget, async function(err, newTarget) {
            if (err) {
                console.log(err);
            } else {

                User.findOne({
                    _id: user._id
                }, async(err, user) => {
                    //this will give you the document what you want to update.. then 
                    user.selfTargetass.push(newTarget._id);

                    // then save that document
                    await user.save();

                });

                res.redirect("/settarget/new");
            }
        })
        console.log(newTarget)
    }

})

app.get('/settarget/complete/:id', async function(req, res) {
    let target = await targetDetails.findById(req.params.id);
    let category_set_trgt = target.category_set_trgt;
    // Assigned By Self
    if (target.assigned_to == req.user.username && target.assigned_to == target.assigned_by) {
        targetDetails.findOne({
            _id: req.params.id
        }, (err, trg) => {
            //this will give you the document what you want to update.. then 
            trg.completed = 1;
            // then save that document
            trg.save();
        });
        User.findOne({
            _id: req.user._id
        }, (err, pub) => {
            //this will give you the document what you want to update.. then 
            if (category_set_trgt == "International Journal") {
                pub.compcntIntJournal += 1;
            } else if (category_set_trgt == "Patent") {
                pub.compcntPatent += 1;
            } else if (category_set_trgt == "National Conference") {
                pub.compcntConf += 1;
            } else if (category_set_trgt == "National Journal") {
                pub.compcntJournal += 1;
            } else if (category_set_trgt == "Book Chapter") {
                pub.compcntnewBook += 1;
            } else if (category_set_trgt == "Edited Book") {
                pub.compcnteditBook += 1;
            } else if (category_set_trgt == "International Conference") {
                pub.compcntIntConf += 1;
            }
            // then save that document
            pub.save();
        });
        // Assigned By Admin
    } else if (target.assigned_to == req.user.username && target.assigned_to != target.assigned_by) {
        targetDetails.findOne({
            _id: req.params.id
        }, (err, trg) => {
            //this will give you the document what you want to update.. then 
            trg.completed = 1;
            // then save that document
            trg.save();
        });
        User.findOne({
            _id: req.user._id
        }, (err, pub) => {
            //this will give you the document what you want to update.. then 
            if (category_set_trgt == "International Journal") {
                pub.compcntIntJournalass += 1;
            } else if (category_set_trgt == "Patent") {
                pub.compcntPatentass += 1;
            } else if (category_set_trgt == "National Conference") {
                pub.compcntConfass += 1;
            } else if (category_set_trgt == "National Journal") {
                pub.compcntJournalass += 1;
            } else if (category_set_trgt == "Book Chapter") {
                pub.compcntnewBookass += 1;
            } else if (category_set_trgt == "Edited Book") {
                pub.compcnteditBookass += 1;
            } else if (category_set_trgt == "International Conference") {
                pub.compcntIntConfass += 1;
            }
            // then save that document
            pub.save();
        });
    }
    res.redirect('/settarget');
});

app.get('/settarget/delete/:id', async function(req, res) {
    let pub = await targetDetails.findById(req.params.id);
    let category_set_trgt = pub.category_set_trgt;
    console.log(category_set_trgt)
    if ((req.user.isAdmin == 1 || pub.assigned_by == req.user.username) && pub.completed == 0) {
        if (category_set_trgt == "International Journal") {
            req.user.cntIntJournal -= 1;
            console.log(req.user.cntIntJournal)
        } else if (category_set_trgt == "Patent") {
            req.user.cntPatent -= 1;
        } else if (category_set_trgt == "National Conference") {
            req.user.cntConf -= 1;
        } else if (category_set_trgt == "National Journal") {
            req.user.cntJournal += 1;
        } else if (category_set_trgt == "Book Chapter") {
            req.user.cntnewBook += 1;
        } else if (category_set_trgt == "Edited Book") {
            req.user.cnteditBook += 1;
        } else if (category_set_trgt == "International Conference") {
            req.user.cntIntConf += 1;
        }
        req.user.save();
        await pub.deleteOne();
    }
    res.redirect('/settarget');
});

app.get("/settarget/new", async function(req, res) {
    if (req.user.isAdmin != 1) {
        let notification = [];

        for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
            let pub = await setTarget.findById(req.user.selfTargetass[i]);
            if (pub) {
                notification.push(pub)
            }
        }

        res.render("newTarget", {
            currentUser: req.user.firstName,
            username: req.user.username,
            grade: req.user.Grade,
            lastName: req.user.lastName,
            School: req.user.School,
            WebOfScience: req.user.WebOfScience,
            ScorpusId: req.user.ScorpusId,
            GoogleScholarId: req.user.GoogleScholarId,
            OrchidId: req.user.OrchidId,
            notify: notification,
        });
    } else {
        try {
            let notification = [];

            for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
                let pub = await setTarget.findById(req.user.selfTargetass[i]);
                if (pub) {
                    notification.push(pub)
                }
            }


            res.render("admTarget", {
                currentUser: req.user.firstName,
                username: req.user.username,
                grade: req.user.Grade,
                lastName: req.user.lastName,
                School: req.user.School,
                WebOfScience: req.user.WebOfScience,
                ScorpusId: req.user.ScorpusId,
                GoogleScholarId: req.user.GoogleScholarId,
                OrchidId: req.user.OrchidId,
                notify: notification,

            });
        } catch {

        }
    }
})

// Set Target End

// Student Publication Start

app.get("/studpub", async function(req, res) {
    if (req.user.isAdmin != 1) {
        try {
            let studPublications = []
            let notification = [];

            for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
                let pub = await setTarget.findById(req.user.selfTargetass[i]);
                if (pub) {
                    notification.push(pub)
                }
            }


            for (let i = 0; i < req.user.studPublications.length; i++) {
                let spub = await studentPublicationDetails.findById(req.user.studPublications[i]);
                if (spub) {
                    studPublications.push(spub);
                }
            }

            req.user.studPublications = studPublications;

            res.render("student_view", {
                sPapers: studPublications,
                username: req.user._id,
                currentUser: req.user.firstName,
                lastName: req.user.lastName,
                School: req.user.School,
                WebOfScience: req.user.WebOfScience,
                ScorpusId: req.user.ScorpusId,
                GoogleScholarId: req.user.GoogleScholarId,
                OrchidId: req.user.OrchidId,
                notify: notification
            });


        } catch (err) {
            console.log(err);
        }
    } else {
        res.redirect("/admstudpub")
    }
});



app.get("/admstudpub", async function(req, res) {
    if (req.user.isAdmin == 1) {
        // Pass all student Publication here
        let studPublications = []
        let notification = [];

        for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
            let pub = await setTarget.findById(req.user.selfTargetass[i]);
            if (pub) {
                notification.push(pub)
            }
        }

        await studentPub.find({}, async function(err, result) {
            if (err) {
                console.log(err);
            } else {
                studPublications = result;
            }
        });

        res.render("admstudent_view", {
            sPapers: studPublications,
            notify: notification,
            currentUser: req.user.firstName,
            lastName: req.user.lastName,
            School: req.user.School,
            WebOfScience: req.user.WebOfScience,
            ScorpusId: req.user.ScorpusId,
            GoogleScholarId: req.user.GoogleScholarId,
            OrchidId: req.user.OrchidId
        });

    } else {
        res.redirect("/studpub");
    }
});



app.post("/studpub", function(req, res) {
    var studentName = req.body.student_name;
    var enrollmentNumber = req.body.enrollment_number;
    var volume_number = req.body.volume_number_studpub;
    var semester = req.body.semester;
    var program = req.body.program_studpub;
    var category = req.body.category_studpub;
    var pubTitle = req.body.title_studpub;
    var journalName = req.body.journal_name_studpub;
    var issueNum = req.body.issue_number_studpub;
    var pageNumber = req.body.page_number_studpub;
    var issnNumber = req.body.issn_number_studpub;
    var indexing = req.body.indexing_studpub;


    let users = req.body.author_studpub.split(',');

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.stupubfile;

    // Use the mv() method to place the file somewhere on your server
    let path = issnNumber + Date.now() + sampleFile.name;
    sampleFile.mv(__dirname + '/Student Publication Uploads/' + path, function(err) {
        if (err)
            return res.status(500).send(err);

        console.log(path);
    });


    var newStuPublication = {
        studentName: studentName,
        enrollmentNum: enrollmentNumber,
        semester: semester,
        program: program,
        category: category,
        publicationTitle: pubTitle,
        journalName: journalName,
        volumeNum: volume_number,
        issueNum: issueNum,
        pageNum: pageNumber,
        issnNum: issnNumber,
        indexing: indexing,
        createdBy: req.user._id
    }
    studentPublicationDetails.create(newStuPublication, async function(err, newStuPublication) {
        if (err) {
            console.log(err);
        } else {
            var author = '';
            //redirect back to the research papers Page
            for (let i = 0; i < users.length; i++) {
                let user = await User.findOne({
                    username: users[i].trim()
                }).exec();
                if (user) {
                    user.studPublications.push(newStuPublication._id);
                    await user.save();
                    if (i === users.length - 1) {
                        author = author + user.firstName + ' ' + user.lastName
                    } else {
                        author = author + user.firstName + ' ' + user.lastName + ','
                    }
                } else {
                    continue;
                }
            }
            newStuPublication.author = author;
            await newStuPublication.save();
            res.redirect("/studpub");
        }
    })

})

app.get("/studpub/new", async function(req, res) {
    let notification = [];

    for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
        let pub = await setTarget.findById(req.user.selfTargetass[i]);
        if (pub) {
            notification.push(pub)
        }
    }

    res.render("student_publication", {
        currentUser: req.user.firstName,
        username: req.user.username,
        grade: req.user.Grade,
        lastName: req.user.lastName,
        School: req.user.School,
        WebOfScience: req.user.WebOfScience,
        ScorpusId: req.user.ScorpusId,
        GoogleScholarId: req.user.GoogleScholarId,
        OrchidId: req.user.OrchidId,
        notify: notification
    });
})
app.get("/studpub/edit", async function(req, res) {
    console.log("Edit Profile")
    let publication = await studentPublicationDetails.findById(req.query.puid)
    let notification = [];

    for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
        let pub = await setTarget.findById(req.user.selfTargetass[i]);
        if (pub) {
            notification.push(pub)
        }
    }

    res.render("student_publication_edit", {
        currentUser: req.user.firstName,
        username: req.user.username,
        grade: req.user.Grade,
        lastName: req.user.lastName,
        School: req.user.School,
        WebOfScience: req.user.WebOfScience,
        ScorpusId: req.user.ScorpusId,
        GoogleScholarId: req.user.GoogleScholarId,
        OrchidId: req.user.OrchidId,
        notify: notification,

        student_name: publication.studentName,
        enrollment_number: publication.enrollmentNum,
        semester: publication.semester,
        program_studpub: publication.program,
        author_studpub: publication.authorName,
        journal_name_studpub: publication.journalName,
        volume_number_studpub: publication.volumeNum,
        issue_number_studpub: publication.issueNum,
        page_number_studpub: publication.pageNum,
        issn_number_studpub: publication.issnNum,
        indexing_studpub: publication.indexing,
        pubid: publication._id
    });
})
app.post('/studpub/edit', async function(req, res) {
    updatestupubRecord(req, res);
    res.redirect('/studpub');

});

function updatestupubRecord(req, res) {
    studentPublicationDetails.findOne({
        _id: req.body.pubid
    }, (err, pub) => {
        //this will give you the document what you want to update.. then 
        pub.studentName = req.body.student_name;
        pub.enrollmentNum = req.body.enrollment_number;
        pub.semester = req.body.semester;
        pub.publicationTitle = req.body.program_studpub;
        pub.journalName = req.body.journal_name_studpub;
        pub.volumeNum = req.body.volume_number_studpub;
        pub.issueNum = req.body.issue_number_studpub;
        pub.pageNum = req.body.page_number_studpub;
        pub.issnNum = req.body.issn_number_studpub;
        pub.indexing = req.body.indexing_studpub;
        // then save that document
        pub.save();

    });

}

app.get('/studpub/delete/:id', async function(req, res) {
    let pub = await studentPublicationDetails.findById(req.params.id);
    // if (req.user.isAdmin == 1 || pub.createdBy == req.user._id) {
    await pub.deleteOne();
    // }
    res.redirect('/studpub');
});




// STUDENT PUBLICATION ENDS

// Funded Project Starts
app.get("/fundprj", async function(req, res) {
    if (req.user.isAdmin != 1) {


        try {
            let fundProject = []

            for (let i = 0; i < req.user.fundProjects.length; i++) {
                let fpro = await fundedProject.findById(req.user.fundProjects[i]);
                if (fpro) {
                    fundProject.push(fpro);
                }
            }

            for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
                let pub = await setTarget.findById(req.user.selfTargetass[i]);
                if (pub) {
                    notification.push(pub)
                }
            }

            req.user.fundProjects = fundProject;

            res.render("funded_project_view", {
                fDetails: fundProject,
                currentUser: req.user.firstName,
                lastName: req.user.lastName,
                School: req.user.School,
                WebOfScience: req.user.WebOfScience,
                ScorpusId: req.user.ScorpusId,
                GoogleScholarId: req.user.GoogleScholarId,
                OrchidId: req.user.OrchidId,
                notify: notification
            });


        } catch (err) {
            console.log(err);
        }
    } else {
        res.redirect("/admfundprj")
    }
});


app.get("/admfundprj", async function(req, res) {
    if (req.user.isAdmin == 1) {

        let notification = [];

        for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
            let pub = await setTarget.findById(req.user.selfTargetass[i]);
            if (pub) {
                notification.push(pub)
            }
        }
        // Pass all funded Project
        let fundProject = []
        await fundedProject.find({}, async function(err, result) {
            if (err) {
                console.log(err);
            } else {
                fundProject = result;
            }
        });


        res.render("admfunded_project_view", {
            fDetails: fundProject,
            currentUser: req.user.firstName,
            lastName: req.user.lastName,
            School: req.user.School,
            WebOfScience: req.user.WebOfScience,
            ScorpusId: req.user.ScorpusId,
            GoogleScholarId: req.user.GoogleScholarId,
            OrchidId: req.user.OrchidId,
            notify: notification,
            notify: notification
        });

    }

});

app.post("/fundprj", function(req, res) {
    var namePrincipalInvestigator = req.body.principal_investigator;
    var nameCoInvestigator = req.body.co_investigator;
    var title = req.body.title_fund_prj;
    var fundingAgency = req.body.funding_agency;
    var overallCost = req.body.Overall_cost;
    var startDate = req.body.start_date;
    var EndDate = req.body.end_date;

    let users = req.body.principal_investigator.split(',');

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let sampleFile = req.files.fundfile;

    // Use the mv() method to place the file somewhere on your server
    let path = Date.now() + sampleFile.name;
    sampleFile.mv('./Funded Project Uploads/' + users + nameCoInvestigator + title + currentDateTime + path, function(err) {
        if (err)
            return res.status(500).send(err);


    });


    var newfundedproject = {
        namePrincipalInvestigator: namePrincipalInvestigator,
        nameCoInvestigator: nameCoInvestigator,
        title: title,
        fundingAgency: fundingAgency,
        overallCost: overallCost,
        startDate: startDate,
        EndDate: EndDate

    }
    fundedProject.create(newfundedproject, async function(err, newfundedproject) {
        if (err) {
            console.log(err);
        } else {
            //redirect back to the research papers Page
            for (let i = 0; i < users.length; i++) {
                let user = await User.findOne({
                    username: users[i].trim()
                }).exec();
                if (user) {
                    user.fundProjects.push(newfundedproject._id);
                    await user.save();
                } else {
                    continue;
                }
            }
            res.redirect("/fundprj");
        }
    })

})
app.get("/fundprj/new", async function(req, res) {
    try {
        let notification = [];

        for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
            let pub = await setTarget.findById(req.user.selfTargetass[i]);
            if (pub) {
                notification.push(pub)
            }
        }


        res.render("funded_project", {
            currentUser: req.user.firstName,
            username: req.user.username,
            grade: req.user.Grade,
            lastName: req.user.lastName,
            School: req.user.School,
            WebOfScience: req.user.WebOfScience,
            ScorpusId: req.user.ScorpusId,
            GoogleScholarId: req.user.GoogleScholarId,
            OrchidId: req.user.OrchidId,
            notify: notification
        });
    } catch (err) {
        console.log(err);
    }
})

app.get("/fundprj/edit", async function(req, res) {
    console.log("Edit Profile")
    let publication = await fundedProject.findById(req.query.puid)
    try {
        let notification = [];

        for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
            let pub = await setTarget.findById(req.user.selfTargetass[i]);
            if (pub) {
                notification.push(pub)
            }
        }

        res.render("edit_funded_project", {
            currentUser: req.user.firstName,
            username: req.user.username,
            grade: req.user.Grade,
            lastName: req.user.lastName,
            School: req.user.School,
            WebOfScience: req.user.WebOfScience,
            ScorpusId: req.user.ScorpusId,
            GoogleScholarId: req.user.GoogleScholarId,
            OrchidId: req.user.OrchidId,
            notify: notification,

            namePrincipalInvestigator: publication.namePrincipalInvestigator,
            nameCoInvestigator: publication.nameCoInvestigator,
            title: publication.title,
            fundingAgency: publication.fundingAgency,
            overallCost: publication.overallCost,
            startDate: publication.startDate,
            EndDate: publication.EndDate,
            pubid: publication._id

        });
    } catch (err) {
        console.log(err);

    }
})
app.post('/fundprj/edit', async function(req, res) {
    updatefundpubRecord(req, res);
    res.redirect('/fundprj');

});

function updatefundpubRecord(req, res) {
    fundedProject.findOne({
        _id: req.body.pubid
    }, (err, pub) => {
        //this will give you the document what you want to update.. then 
        pub.namePrincipalInvestigator = req.body.principal_investigator;
        pub.nameCoInvestigator = req.body.co_investigator;
        pub.title = req.body.title_fund_prj;
        pub.fundingAgency = req.body.funding_agency;
        pub.overallCost = req.body.Overall_cost;
        pub.startDate = req.body.start_date;
        pub.EndDate = req.body.end_date;
        // then save that document
        pub.save();

    });

}

app.get('/fundprj/delete/:id', async function(req, res) {
    let pub = await fundedProject.findById(req.params.id);
    // if (req.user.isAdmin == 1 || pub.createdBy == req.user._id) {
    await pub.deleteOne();
    // }
    res.redirect('/fundprj');
});


// Funded Project Ends
app.get("/publication/:id", function(req, res) {

})

//AUTH Routes
app.get("/register", function(req, res) {
    res.render("register");
});
app.post("/register", function(req, res) {

    let user = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        School: req.body.School,
        Grade: req.body.Grade,
        WebOfScience: req.body.WebOfScience,
        ScorpusId: req.body.ScorpusId,
        GoogleScholarId: req.body.GoogleScholarId,
        OrchidId: req.body.OrchidId,
        emailId: req.body.email,
        isAdmin: req.body.isAdmin,

        // cntIntJournalass: 0,
        // cntPatentass: 0,
        // cntConfass: 0,


        // cntIntJournal: 0,
        // cntPatent: 0,
        // cntConf: 0,


        // compcntIntJournal: 0,
        // compcntPatent: 0,
        // compcntConf: 0,

        // compcntIntJournalass: 0,
        // compcntPatentass: 0,
        // compcntConfass: 0

    });

    User.register(user, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function() {
            res.redirect("/login");
        });

    });
});


//LOGIN
app.get("/admlogin", async function(req, res) {
    if (req.user.isAdmin == 1) {
        let notification = [];

        for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
            let pub = await setTarget.findById(req.user.selfTargetass[i]);
            if (pub) {
                notification.push(pub)
            }
        }

        res.render("admlogin", {
            currentUser: req.user.firstName,
            username: req.user.username,
            grade: req.user.Grade,
            lastName: req.user.lastName,
            School: req.user.School,
            WebOfScience: req.user.WebOfScience,
            ScorpusId: req.user.ScorpusId,
            GoogleScholarId: req.user.GoogleScholarId,
            OrchidId: req.user.OrchidId,
            notify: notification,
            notify: notification

        });
    } else {
        res.redirect("/login")
    }
})

app.get("/login", async function(req, res) {
    if (req.user.isAdmin == 1) {
        res.redirect("/admlogin")
    } else {
        try {
            let notification = [];

            for (let i = req.user.selfTargetass.length - req.user.notification; i < req.user.selfTargetass.length; i++) {
                let pub = await setTarget.findById(req.user.selfTargetass[i]);
                if (pub) {
                    notification.push(pub)
                }
            }


            res.render("login", {
                currentUser: req.user.firstName,
                username: req.user.username,
                grade: req.user.Grade,
                lastName: req.user.lastName,
                School: req.user.School,
                WebOfScience: req.user.WebOfScience,
                ScorpusId: req.user.ScorpusId,
                GoogleScholarId: req.user.GoogleScholarId,
                OrchidId: req.user.OrchidId,
                notify: notification,
                notify: notification,

                // Self Targets
                compcntPatent: req.user.compcntPatent,
                cntPatent: req.user.cntPatent,
                compcntIntJournal: req.user.compcntIntJournal,
                cntJournal: req.user.cntJournal,
                compcntJournal: req.user.compcntJournal,
                cntnewBook: req.user.cntnewBook,
                compcntnewBook: req.user.compcntnewBook,
                cnteditBook: req.user.cnteditBook,
                compcnteditBook: req.user.compcnteditBook,
                cntIntConf: req.user.cntIntConf,
                compcntIntConf: req.user.compcntIntConf,
                cntIntJournal: req.user.cntIntJournal,
                compcntConf: req.user.compcntConf,
                cntConf: req.user.cntConf,
                // Assigned Targets
                cntIntJournalass: req.user.cntIntJournalass,
                cntPatentass: req.user.cntPatentass,
                cntConfass: req.user.cntConfass,
                compcntIntJournalass: req.user.compcntIntJournalass,
                compcntPatentass: req.user.compcntPatentass,
                compcntConfass: req.user.compcntConfass,
                cntnewBookass: req.user.cntnewBookass,
                compcntnewBookass: req.user.compcntnewBookass,
                cnteditBookass: req.user.cnteditBookass,
                compcnteditBookass: req.user.compcnteditBookass,
                cntIntConfass: req.user.cntIntConfass,
                compcntIntConfass: req.user.compcntIntConfass,
                compcntJournalass: req.user.compcntJournalass,
                cntJournalass: req.user.cntJournalass,



            });
        } catch (err) {
            console.log(err);
        }


    }
})
app.post("/login", passport.authenticate("local", {
    successRedirect: "/login",
    failureRedirect: "/"
}), function(req, res) {

});

//LOGOUT 
app.get("/logout", function(req, res) {
    console.log(req.user.notification)

    User.findOne({
        _id: req.user._id
    }, (err, pub) => {
        //this will give you the document what you want to update.. then 
        if (pub) {
            pub.notification = 0;
        }
        // then save that document
        pub.save();
    });


    req.logout();

    res.redirect("/");
})


app.listen(PORT, function() {
    console.log("Research Paper Application has Started!")

});