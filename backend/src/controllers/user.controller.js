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
    res.status(200).json(user);
}

export async function updateUser(req, res){
    const user = await userService.updateUser(req.params.id, req.body.name, req.body.age);
    res.status(200).json(user);
}

export async function patchUser(req, res){
    const user = await userService.patchUser(req.params.id, req.body);
    res.status(200).json(user);
}

export async function deleteUser(req, res){
    await userService.deleteUser(req.params.id);
    res.sendStatus(204);
}

