import * as userService from "../services/user.service.js";

export async function createUser(req, res) {
    const user = await userService.createUser(req.body.name, req.body.age);
    res.status(201).json(user);
}

export async function getUsers(req, res){
    const users = await userService.getUsers();
    res.status(200).json(users);
}

export async function getUserById(req, res){
    const user = await userService.getUserById(req.params.id);
    if(user){
        res.status(200).json(user);
    }
    else{
        res.status(404).send("User Not Found");
    }
}

export async function updateUser(req, res){
    const user = await userService.updateUser(req.params.id, req.body.name, req.body.age);
    if(user){
        res.status(200).json(user);
    }
    else{
        res.status(404).json({
            "message" : "User Not Found"
        });
    }
}

export async function patchUser(req, res){
    const user = await userService.patchUser(req.params.id, req.body);
    if(user){
        res.status(200).json(user);
    }
    else{
        res.status(404).json({
            "message" : "User Not Found"
        });
    }
}

export async function deleteUser(req, res){
    const user = await userService.deleteUser(req.params.id);
    if(user){
        res.sendStatus(204);
    }
    else{
        res.status(404).json({
            "message" : "User Not Found"
        });
    }
}

