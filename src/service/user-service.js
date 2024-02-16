import {validate} from "../validation/validation.js";
import {getUserValidation, loginUserValidation, registerUserValidation, updateUserValidation} from "../validation/user-validation.js";
import {prismaClient} from "../application/database.js";
import bcrypt from "bcrypt";
import {ResponseError} from "../error/response-error.js";
import {v4 as uuid} from "uuid";
import jwt from "jsonwebtoken"
//const jwt = require('jsonwebtoken');



const register = async (request) => {
    const user = validate(registerUserValidation,request);

    const countUser = await prismaClient.user.count({
        where:{
            username: user.username
        }
    });

    if(countUser === 1){
        throw new ResponseError(400, "Username already exist");
    }


    user.password = await bcrypt.hash(user.password,10);

    return  prismaClient.user.create({
        data:user,
        select:{
            username: true,
            name: true
        }
    });
}

const login = async (request) => {
    const loginRequest = validate(loginUserValidation, request);

    const user = await prismaClient.user.findUnique({
        where: {
            username: loginRequest.username
        },
        select: {
            username: true,
            password: true
        }
    });

    if(!user) {
        throw new ResponseError(401, "Username or password wrong");
    }

    const isPasswordValid = await bcrypt.compare(loginRequest.password, user.password);

    if(!isPasswordValid){
        throw new ResponseError(401, "Username or password wrong");
    }

    //const token = uuid().toString();

    var token = jwt.sign({ username: user.username }, 'rzlpbg@211017');

    // let webtoken;
    // jwt.sign({
    //     username: user.username
    // }, 'rahasia1234', function(err, token) {
    //     if (err) {
    //         // Handle the error appropriately
    //         console.error(err);
    //     } else {
    //         // Assign the generated token to the variable
    //         webtoken = token;
    //
    //         // Now you can use 'generatedToken' as needed
    //         console.log(webtoken);
    //     }
    //
    // });

    return prismaClient.user.update({
        data: {
            token: token
        },
        where:{
            username: user.username
        },
        select: {
            token: true
        }
    });
}

const get = async (username) => {
    username = validate(getUserValidation, username);
 
    const user = await prismaClient.user.findUnique({
        where: {
            username: username
        },
        select: {
            username: true,
            name: true
        }
    });

    if(!user){
        throw new ResponseError(404, "User not found")
    }

    return user;
}

const update = async (request) => {
    const user = validate(updateUserValidation, request);

    const totalUserInDatabase = await prismaClient.user.count({
        where: {
            username: user.username
        }
    });

    if(totalUserInDatabase !== 1 ){
        throw new ResponseError(404, "user is not foud");
    }

    const data = {};
    if (user.name) {
        data.name = user.name;
    }
    if (user.password) {
        data.password = await bcrypt.hash(user.password, 10);
    }

    return prismaClient.user.update({
        where: {
            username: user.username
        },
        data: data,
        select: {
            username: true,
            name: true
        }
    })
}

const logout = async(username) => {
    username = validate(getUserValidation, username);

    const user = await prismaClient.user.findUnique({
        where: {
            username: username
        }
    });

    if(!user){
        throw new ResponseError(404, "user is not found");
    }

    return prismaClient.user.update({
        where: {
            username: username
        },
        data: {
            token: null
        },
        select:{
            username: true
        }
    })
}


export default {
    register, 
    login,
    get,
    update,
    logout
}