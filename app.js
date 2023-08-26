const express = require("express");
const body_parser = require("body-parser");
const mongoose = require("mongoose");

const mongo_con = mongoose.createConnection("mongodb://localhost:27017/todoDB")


const mongo_item_schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})

const item_model = mongo_con.model("Item", mongo_item_schema);

const item1 = new item_model({
    name: "Welcome to your todo list!"
});

const item2 = new item_model({
    name: "Welcome to your todo list 2!"
});

const item3 = new item_model({
    name: "Welcome to your todo list 3!"
});

const list_schema = new mongoose.Schema({
    name: String,
    items: [mongo_item_schema]
});

const list_model = mongo_con.model("List", list_schema);


const app = express();
app.use(body_parser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("_public"));

var todo_list_ = [];
var work_list_ = [];

let port = process.env.PORT;
if(port == null || port == "") {
    port = 3000;
}

app.listen(port, function(req, res) {
    
    console.log("app is running...");

});

app.get("/", function(req, res) {

    item_model.find(function(err, item_results) {
        if(err) {
            console.log(err);
        } else {
            
            if(item_results.length == 0) {
                item_model.insertMany([item1, item2, item3], function(err) {
                    if(err) {
                        console.log(err + " Failed inserting items");
                    } else {
                        console.log("Successful!");
                    }

                });

                res.redirect("/");

            } else {
                list_content(res, "todo", item_results);
            }

            

        }
    });

});

app.get("/:title", function(req, res) {

    const title = req.params.title;

    const list = new list_model({
        name: title,
        items: [item1, item2, item3]
    })

    list_model.findOne({name:title}, function(err, res_find) {
        if(err) {
           console.log(error);
        } else {
        
            if(res_find == null) {
                list.save();
                res.redirect("/" + title);
            } else {
                list_content(res, title, res_find.items);
            }
        }

    }); 

})

app.get("/about", function(req, res) {
    res.render("about");
})

app.post("/", function(req, res) {   

    const new_item = new item_model({
        name: req.body.new_item
    });

    const my_title = req.body.list_title;
    const today_ = new Date().toLocaleString('en-us', {weekday:"long", day:"numeric", month:"long", year:"numeric"});
   
    if(today_ == my_title) {

        new_item.save();
        res.redirect("/");

    } else {

        list_model.findOne({name:my_title.toLowerCase().replace(" list", "")}, function(err, res_find) {
            if(err) {
                console.log(err);
            } else {
                if(res_find!=null) {
                    res_find.items.push(new_item);
                    res_find.save();
                    res.redirect("/" + my_title.toLowerCase().replace(" list", ""));
                }
            }

        });
    }
});

app.post("/delete_item", function(req, res) {

    const item_id = req.body.chkbox;

    const my_title = req.body.list_title;
    const today_ = new Date().toLocaleString('en-us', {weekday:"long", day:"numeric", month:"long", year:"numeric"});
   
    if(today_ == my_title ) {

        item_model.findByIdAndRemove(item_id, function(err) {
            if(err) {
                console.log(err + " Failed deleting items");
            } else {
                console.log("success deleting items");
            }
        })
    
        res.redirect("/")
    }
    else {

        list_model.findOneAndUpdate({name:my_title.toLowerCase().replace(" list", "")},
                                    {$pull: {items:{_id: item_id}}}, 
        function(err, res_find) {
            if(err) {
                console.log(err);
            } else {
                res.redirect("/" + my_title.toLowerCase().replace(" list", ""));
            }

        });

    }
});

function list_content(res, heading, list_) {

    let my_title = ""

    if(heading!=="todo") {
        my_title =   titleCase(heading) + " List"
    } else {

        const today_ = new Date();
        const day_ = today_.getDay();
    
        my_title = today_.toLocaleString('en-us', {weekday:"long", day:"numeric", month:"long", year:"numeric"})
    }
    
    res.render("list",{title_: my_title, list_:list_});
}

function titleCase(str) {
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
}

mongoose.connection.close();
