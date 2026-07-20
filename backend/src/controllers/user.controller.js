import * as userService from "../services/user.service.js";

export async function getUsers(req, res){
    const users = await userService.getUsers(req.user);
    res.status(200).json(users);
}

export async function getUserById(req, res){
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(user);
}

export async function updateUser(req, res){
    const user = await userService.updateUser(req.user, req.params.id, req.body.name, req.body.age);
    res.status(200).json(user);
}

export async function patchUser(req, res){
    const user = await userService.patchUser(req.user, req.params.id, req.body); // middleware is assigning request the user
    res.status(200).json(user);
}

export async function deleteUser(req, res){
    await userService.deleteUser(req.user, req.params.id);
    res.sendStatus(204);
}

