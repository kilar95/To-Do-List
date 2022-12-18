// jshint eversion: 6

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");


app.use(express.urlencoded({extended: true})); /* to use express bodyparser (serve per analizzare i dati inseriti nel form [req.body])*/
app.set('view engine', 'ejs'); /* to use ejs files */
app.use(express.static("public"));

// async function main() {
//   try {
    //connect to the server
     /*await*/ mongoose.connect('mongodb://127.0.0.1/todolist', {
        useNewUrlParser: true,
    });
    console.log("Successfully connected to the server");

    // create new Schema
    const itemSchema = new mongoose.Schema ({
      name: String
    });

    // create list Schema
    const listSchema = new mongoose.Schema ({
      name: String,
      items: [itemSchema]
    })

    // create new MODEL
    const Item = new mongoose.model ("Item", itemSchema);

    // create List MODEL
    const List = new mongoose.model("List", listSchema);

    // create default starting items
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
//   } finally {
//     // Ensures that the client will close when you finish/error
//     setTimeout(() => {mongoose.connection.close()}, 1500);
//     console.log("Successfully saved all the items to todolist database.");
//   }
// }
//
// main().catch(console.dir);

//GET
app.get("/", function(req, res) {
  // dobbiamo inserire le default items solo la prima volta che lanciamo l'app, altrimenti continuerebbero ad aggiungersi.
  // questo vuol dire che dobbiamo inserirle solo se l'arrey foundItems è vuoto
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      // insert the default items in the database
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items correctly loaded on server.");
        }
      });
      // facciamo il redirect alla home perchè così facendo rientrerà nella funzione find, ma questa volta andrà nell'else statement e le caricherà sulla pagina
      res.redirect("/")
    } else {
      // let day = date();   /* oppure: day = date.getDate(); nel caso in cui il modulo esporti più funzioni (tra cui getDate) PERCHE' è UN OGGETTO */

    // carichiamo sul server il file EJS "list" passandogli la variabile "day" e "task", la quale però viene definita nel POST,
    // ovvero SOLO quando l'utente inserisce una nuova item nella lista! QUINDI DOBBIAMO DEFINIRE TASK(s) ALL'INIZIO DEL CODICE
      res.render("list", {listTitle: "Today", newTasks: foundItems});
    };
  });
});


//POST
app.post("/", function(req, res) {
  // quando inseriamo una nuova item nella lista e quindi richiediamo di inviare i dati del form, vengono passati due parametri: newTask (name dell'input) e button (name del bottone).
  let newTaskName = req.body.newTask;
  // il bottone ha come nome "button" e come valore il titolo della lista, che viene passato a list.ejs
  let listName = req.body.button;

  const task = new Item ({
    name: newTaskName
  });

  if (listName === "Today") { /* quindi se è la lista principale */
    task.save();
    //per rientrare nel flusso if/else e visualizzare le items nel db
    res.redirect("/");
  } else { /* se siamo nella custom list */
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(task);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// POST DELETE
app.post("/delete", function(req, res) {
  // quando elimino un item dalla lista ho bisogno di sapere due informazioni: l'id dell'item che voglio eliminare e la lista dalla quale devo eliminarla
  // passo l'id dell'item selezionata che voglio eliminare usando il value del checkbox, che è uguale all'id dell'item da cancellare.
  const checkedItemId = req.body.checkbox;
  // passo invece il nome della lista utilizzando il value dell'input Hidden
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Item Successfully Removed from db.");
        res.redirect("/");
      }
    });
  } else {
    // nel metodo findOneAndUpdate mettiamo il nome della lista che va updatata, poi usiamo $pull per aggiornare il campo "items", e in particolare per l'item che ha un id checkedItemId, il terzo elemento che dobbiamo passare è la callback function
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
  // we have to check if the list already exist. if it exist we can't proceed with adding the default items every time we redirect to the custom list route
  List.findOne({name: customListName}, function(err, foundList){
    if(!err) {
      if (!foundList) {
        // if there was no foundlist...
        // create new list
        const list = new List ({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        // if the foundlist exist, then show the existing list
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
