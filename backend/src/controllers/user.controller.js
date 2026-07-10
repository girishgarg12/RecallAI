const users = [];
var nextId = 1;


export function createUser(req, res) {
    const user = {
            'id' : nextId++,
            'name' : req.body.name,
            'age' : req.body.age
        };
        users.push(user);
        res.status(201).json(user);
}

export function getUsers(req, res){
    res.json(users);
}

export function getUserById(req, res){
    const id = req.params.id;
    const user = users.find(u => u.id === parseInt(id));
    if(user){
        res.status(200).json(user);
    }
    else{
        res.status(404).send("User Not Found");
    }
}

export function updateUser(req, res){
     const id = req.params.id;
    const user = users.find(u => u.id === Number(id));
    if(user){
        user.name = req.body.name;
        user.age = req.body.age;
        res.status(200).json(user);
    }
    else{
        res.status(404).json({
            "message" : "User Not Found"
        });
    }
}

export function patchUser(req, res){
    const id = req.params.id;
    const user = users.find(u => u.id === Number(id));
    if(user){
        if('name' in req.body.name){
            user.name = req.body.name;
        }
        if('age' in req.body){
            user.age = req.body.age;
        }
        res.status(200).json(user);
    }
    else{
        res.status(404).send("User Not Found");
    }
}

export function deleteUser(req, res){
    const id = req.params.id;
    const user = users.findIndex(u => u.id === Number(id));
    if(user === -1){
        return res.status(404).send("User Not Found");
    }
    users.splice(user, 1); 
    res.sendStatus(204);
}