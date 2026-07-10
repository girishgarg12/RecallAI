const users = [];
var nextId = 1;


export function createUser(name, age) {
    const user = {
            'id' : nextId++,
            'name' : name,
            'age' : age
        };
    users.push(user);
    return user;
}

export function getUsers(){
    return users;
}

export function getUserById(id){
    const user = users.find(u => u.id === parseInt(id));
    if(user){
        return user;
    }
    else{
        return null;
    }
}

export function updateUser(id , name , age){
    const user = users.find(u => u.id === Number(id));
    if(user){
        user.name = name;
        user.age = age;
        return user;
    }
    else{
        return null;
    }
}


export function patchUser(id , name , age){
    const user = users.find(u => u.id === Number(id));
    if(user){
        if(name !== undefined){
            user.name = name;
        }
        if(age !== undefined){
            user.age = age;
        }
        return user;
    }
    else{
        return null;
    }
}

export function deleteUser(id){
    const user = users.findIndex(u => u.id === Number(id));
    if(user === -1){
        return null;
    }
    users.splice(user, 1); 
    return true;
}