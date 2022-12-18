// jshint eversion: 6

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");


app.use(express.urlencoded({extended: true})); 
app.set('view engine', 'ejs'); 
app.use(express.static("public"));


     /*await*/ mongoose.connect('mongodb://127.0.0.1/todolist', {
        useNewUrlParser: true,
    });
    console.log("Successfully connected to the server");

   
    const itemSchema = new mongoose.Schema ({
      name: String
    });

    
    const listSchema = new mongoose.Schema ({
      name: String,
      items: [itemSchema]
    })

    
    const Item = new mongoose.model ("Item", itemSchema);

   
    const List = new mongoose.model("List", listSchema);

    const item1 = new Item ({
      name: "Welcome to your to do list!"
    });

    const item2 = new Item ({
      name: "Click on the + button to add an item to the list."
    });

    const item3 = new Item ({
      name: "<-- Click here to delete an item."
    });

    const defaultItems = [item1, item2, item3];


//GET
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items correctly loaded on server.");
        }
      });
    } else {
      res.render("list", {listTitle: "Today", newTasks: foundItems});
    };
  });
});


//POST
app.post("/", function(req, res) {
  let newTaskName = req.body.newTask;
  let listName = req.body.button;

  const task = new Item ({
    name: newTaskName
  });

  if (listName === "Today") { 
    task.save();
    res.redirect("/");
  } else { 
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(task);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// POST DELETE
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Item Successfully Removed from db.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
            res.redirect("/" + listName);
          }
        });
      };
});

//GET customList
app.get("/:customList", function(req, res) {
  const customListName = _.capitalize(req.params.customList);
  List.findOne({name: customListName}, function(err, foundList){
    if(!err) {
      if (!foundList) {
        const list = new List ({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {listTitle: foundList.name, newTasks: foundList.items});
      }
    }
  });
});

//GET ABOUT
app.get("/about", function(req,res) {
  res.render("about");
})

app.listen(3000, function() {
  console.log("Server is up and running on port 3000");
});
