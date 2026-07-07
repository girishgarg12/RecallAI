import express from "express";

const app = express();

app.use(express.json());

const users = [];
var nextId = 1;

app.use((req, res, next) => {
    console.log("Request recieved 1");
    next();
});

app.use((req, res, next) => {
    console.log("Request recieved 2");
    next();
});

app.get("/", (req, res) => {
    if(req.id === undefined){
        const newObj = {
            'id' : nextId++,
            'name' : req.body.name,
            'age' : req.body.age
        };
        users.push(newObj);
    }
});

app.post("/users", (req, res) => {
        const newObj = {
            'id' : nextId++,
            'name' : req.body.name,
            'age' : req.body.age
        };
        users.push(newObj);
        res.status(201).json(newObj);
});

app.get("/users", (req,res) => {
    res.json(users);
})

app.get("/users/:id", (req,res) => {
    const id = req.params.id;
    const user = users.find(u => u.id === parseInt(id));
    if(user){
        res.status(200).json(user);
    }
    else{
        res.status(404).send("User Not Found");
    }
})

app.put("/users/:id", (req,res)=>{
    const id = req.params.id;
    const user = users.find(u => u.id === Number(id));
    if(user){
        user.name = req.body.name;
        user.age = req.body.age;
        res.status(200).json(user);
    }
    else{
        res.status(404).send("User Not Found");
    }
});

app.patch("/users/:id", (req,res)=>{
    const id = req.params.id;
    const user = users.find(u => u.id === Number(id));
    if(user){
        if(req.body.name){
            user.name = req.body.name;
        }
        if(req.body.age){
            user.age = req.body.age;
        }
        res.status(200).json(user);
    }
    else{
        res.status(404).send("User Not Found");
    }
});
// Route and query parameters

// app.get("/users/:id", (req, res) =>{
//     const id =req.params.id;
//     res.json({
//         "message": "User ID received",
//         "id": id
//         })
// });

// app.get("/users", (req,res) => {
//     const name = req.query.name;
//     res.json({
//         "message": "Query parameter received",
//         name
//     })
// })

export default app;